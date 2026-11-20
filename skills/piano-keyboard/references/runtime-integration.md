# 可执行核心接入：先复用，再连接界面

适用于所有新建页面。不要先手写数百行映射、计时与判定再等待用户纠错。

## 固定执行顺序

1. 清点并确认曲谱；读取 score-schema、score-recognition。先验证，再规范化、分析映射。
2. `node scripts/export_runtime.mjs APP` 导出 `piano-runtime.js`、`piano-view.js`、`baseline.css`。导出工具使用安装目录内经过测试的模块，不依赖仓库示例或远程下载。它只覆盖这三个生成文件，不修改曲谱。
3. 使用 baseline-recipe 的 DOM，按下列顺序加载本地普通脚本：规范化后的 `score.js`（赋给window.PIANO_SCORE）、piano-runtime.js、piano-view.js、audio/salamander-audio.js、自己的界面适配器。file打开不使用fetch读取JSON，也不用type=module跨文件加载。
4. 接入下面的明确接口；再导出完整音源并接入实际加载反馈。
5. 浏览器打开**实际输出**，运行audit_interface，完成操作矩阵。失败项由Agent自行修复并重跑相关检查，不能把第一轮可打开的页面交给用户继续找错。最终报告必须列出命令、退出码、截图和未测项。

## 模块职责与接口

`PianoRuntime` 导出原有 score、normalize、keyboard-mapping、practice-model、prompt-state 模块的接口。

```js
const R = window.PianoRuntime;
const source = R.normalizeScore(window.PIANO_SCORE);
const model = new R.PracticeModel(source, {mode:'auto', speed:1, loop:false});
let allocation = R.allocate(model.required);
const locks = new Map(); // KeyboardEvent.code -> 原音高；keyup前不变
// 每次当前组改变：
allocation = R.allocate(model.required, allocation.byCode, locks);
const prompt = R.canonicalPrompt(model.current, allocation);
R.applyPromptClasses(document.querySelectorAll('.computer-key'), prompt, 'target');
PianoView.renderPiano(document.getElementById('piano61')); // 初始化一次
// 每帧只更新位置；groups必须按time排序，同一时刻的音先合并成一个和弦组。
PianoView.renderFlow(document.getElementById('noteFlow'), [
  {time:model.current?.time || 0, current:true, prompt}
], model.time);
```

上例专用于auto练习模式，不能直接用于demo。demo的可见step必须先过滤 `target.hands.includes("R")`，再allocate和canonicalPrompt；不能直接用含双手目标的model.current渲染字母。示范音频仍必须调度完整双手事件。

示例只展示接口，不是完整应用。实际音符流应传入当前组及后续可见组，各组分别由canonicalPrompt生成prompt。同一首歌/模式下维持稳定像素/秒比例：初始化时用 `const scale=PianoView.flowScale(model.steps,lane.clientWidth)` 计算整段固定比例；每帧传当前及后续最多6组到 `renderFlow(lane,groups,model.time,scale)`。窗口尺寸/曲目/速度变化后重算scale，不能每帧随可见组变化缩放，也不能为每个音单独指定相同left。`renderFlow`按时间计算位置并为密集音符提供最小间隔；多个字符只有同组和弦才能共用横坐标。

- `makeClock(score,speed).at(tickPosition)`分段积分全部tempoMap，音符结束时间用at(start+duration)，不能用首个bpm乘整曲。timeSignature的tick定义以schema为准。
- `model.resume()/pause()/reset()`及`model.update(deltaSeconds)`控制时间；update返回本轮到点的自动伴奏事件。不要另开伴奏setInterval。时间速度已在model.clock里换算，delta再乘speed会双重加速。
- 按键先按code去重、忽略repeat和输入框/下拉框编辑事件；以locks里的音或allocation.byCode.get(code).note发声。练习再调用model.press(note,performance.now()/1000)，由模型检查waiting。不能在keydown里无条件index++；提前按不能通过。
- keyup按锁定音释放声音并调用model.release(note)，删除code锁。音高相同的不同声部用独立voice ID；不能按音高一刀切释放其他声音。
- pause、reset、切曲、切模式、范围变更、blur、visibilitychange一律调用audio.stopAll、清理code锁、pending声音与model.releaseAll。resume重新建立帧时间基点，不能把暂停时间算入delta。
- 异步加载采用generation序号：开始/切曲各捕获序号；取消/重置/换模式递增；await后先核对序号才允许启动。迟到的加载完成不能恢复已取消会话。
- 范围使用selectRange派生数据。谱事件保留原小节号，时钟从所选范围起点换算；不改写原谱。循环回所选范围起点并停止旧声音。
- `PracticeModel` 的demo提供目标分组而非自动音频播放器。适配器必须用同一makeClock建立完整双手事件队列（含纯左手时间点），逐事件调度；可见prompt仅取右手。不能把“用户输入自动按对”当作示范时钟。
- `PianoView`只负责DOM布局，不播放声音、不改变model。renderPiano生成每键data-midi和aria-label；适配器根据实际绑定填letter，根据target/down/sounding更新类。鼠标pointerdown/up/cancel、移出及失焦都需释放，不能只画静态61键。

## 必测场景与修复闭环

| 场景 | 验收 |
|---|---|
| 初始/暂停截图 | 未来字符分开、钢琴每个标签落在自己的键上；没有标签挤成一团 |
| 到线前按目标 | 发声但不推进；到线后松开再按才通过 |
| 两次相同音 | 一次keydown及repeat不能通过两组 |
| 和弦边界 | 120ms通过，超过边界失败，松开重试 |
| 变速谱+速度控件 | 经过第二tempo段后flow和声音仍对齐，速度不重复乘算 |
| 纯左手伴奏时间点 | auto及demo仍按时发声，不依附右手keydown |
| 加载中取消/重置/切模式 | 完成解码后仍保持已取消状态，无迟到发声 |
| 暂停/切出窗口/原谱弹窗 | 无挂音、不误计分、不把表单输入当琴键 |

禁止以validate_project通过替代以上场景。该工具主要检查资源与源码；audit_interface补充字母重叠、标签归属、当前提示一致性及布局，但仍不证明实际音频或整曲通关。保留失败记录，修复后只重跑相关检查，不修改验收脚本迎合输出。
