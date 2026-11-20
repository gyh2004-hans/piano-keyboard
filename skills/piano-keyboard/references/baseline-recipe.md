# 慢慢弹成品基准：逐步实施配方

本文件与 `assets/interface/baseline.css` 随 Skill 安装。新页面默认遵守本配方。目标是纸白、深绿、浅绿键帽的钢琴跟练工作台。用户明确要求换主题时才改变视觉基准，并在报告中记录要求。

## 1. 先建立真实内容清单

列出实际提供的曲目、原谱页数、可练习小节、左右手与识谱疑点。只有一首就显示一首，不补“即将推出”、灰色锁定卡、无数据曲目。未授权简化时保持原谱音符、节奏、左右手与完整范围；不能把搜索到的主旋律或自编和弦标成原谱完整版。缺谱时报告缺失，不能靠更换曲目掩盖。

## 2. 使用本地样式和固定 DOM 顺序

复制 `assets/interface/baseline.css` 到输出 `baseline.css`，在页面中加载。样式是可复用基础，不是完整应用。下面是 DOM 结构契约；每个区域必须填入真实运行控件和数据，不能原样交付空节点。

```html
<header class="baseline-header"><div class="baseline-brand">慢慢弹</div><span>键盘钢琴练习</span></header>
<main class="baseline-main">
  <div class="baseline-intro"><h1>让每一个音，慢慢发生。</h1></div>
  <div class="baseline-layout">
    <aside class="baseline-library"><h2>选择一首，开始练习</h2><div id="songRail"></div></aside>
    <section class="baseline-practice">
      <div class="baseline-song-header"><h2 id="title"></h2><p id="subtitle"></p></div>
      <div class="baseline-progress"><div id="progressBar"></div></div>
      <div id="noteFlow" class="note-flow"><div class="flow-line"></div></div>
      <div id="computerKeyboard"></div>
      <div class="baseline-piano-scroll"><div id="piano61" data-key-count="61"></div></div>
      <div class="baseline-stats" aria-live="polite"></div>
    </section>
    <aside class="baseline-settings" aria-label="练习设置"></aside>
  </div>
</main>
```

不要用全屏欢迎页遮住工作台；页面初始即显示曲库、练习区与设置。点击开始才解锁音频并显示真实加载进度。加载完成、取消、失败均回到工作台。

## 3. 先验布局，再接引擎

2560×1440 下：主容器最大 2480px，左右内边距 48px；三栏 248px / 自适应 / 300px，间隔 26px。中央白色练习卡，圆角 19px、细描边、轻阴影。背景 `#f7f6f2`，正文 `#243d35`，主色 `#327758`。标题宋体回退，正文系统中文无衬线，不加载网络字体。

中央由上到下：曲名/进度 → 260px 音符流 → 四排电脑键盘（键高64px）→ 190px 61键钢琴 → 统计。判定线位于音符流宽度28%，字符34px，和弦上下堆叠。不能缩成一排静态大按钮或只显示“下一键”。运动只改变音组 transform，布局高度不随音符数改变。

四排完整标签依次为 `1234567890-=`、`QWERTYUIOP[]`、`ASDFGHJKL;'`、`ZXCVBNM,./`，共45个物理键，其中35个为标准映射。用 `.computer-row`、`.computer-key`、内层 `strong`（字母）及 `span`（音高/状态）渲染。普通浅绿、目标黄绿、左手米黄、按下深绿、错误浅红；同时用边框和状态文字区分。

钢琴是C2–C7共61键（36白25黑），不是61个同宽竖条。白键flex排列，黑键绝对定位于正确白键间隙；黑键中心百分比按 `(之前白键数 / 36) * 100`，再减半个黑键宽度。按下、目标、发声状态要与原始音高一致。

曲库视口高660px，卡100px、间隔12px：至少六首真实曲目时恰有六张完整卡片。少于六首保留空位，超过六首原生滚动到底停止；不能轮播、虚构曲目或用占位卡凑数。1366宽用75px卡、8px间隔、490px视口。手机保留曲库入口，允许钢琴容器内部滚动，不能用body overflow-x:hidden掩盖溢出。

## 4. 将全部控件接入一个状态源

右栏依次放模式、起止小节、速度、循环、开始/暂停、重置、音量、原谱入口与简短说明。六个模式使用 `data-mode=auto|both|right|left|demo|free`，选择状态用aria-pressed。新建也必须具备这些能力，不只在修复时保留。

| 操作 | 可观察结果 |
| --- | --- |
| 切曲/换范围/换模式 | 停止旧声音及计时；重新生成分组、映射、预加载集合；进度重置到所选范围 |
| 开始 | 音频解锁、真实解码进度，成功后才启动时钟；失败可重试，取消不启动 |
| 弹错 | 实际发声、失误加一、当前组不推进 |
| 弹对/和弦 | 120ms内完成才推进；连续同音必须松开重按 |
| 长音松开 | 无惩罚，不阻止乐谱时间继续 |
| 自动伴奏/示范 | 伴奏能听见，提示字母只取旋律canonicalPrompt |
| 暂停/恢复 | 暂停清理发声与按键锁；恢复保持当前位置，不累计暂停时间 |
| 重置/失焦 | 释放所有声音和物理键锁；重置另清理统计与位置 |
| 循环/结束 | 到所选终点循环或显示完成，不越界 |
| 原谱 | 打开实际本地图片，可切页/关闭；无图片显示缺失说明 |

不要把控件点击后只改颜色当作完成。源数据保持不可变；映射、显示、音频和计时使用派生状态。实现算法按 practice-engine、keyboard-mapping、audio 与 prompt-consistency 文档。

## 5. 运行验收并保存证据

先运行数据验证、映射分析、音源验证及 `validate_project.mjs`。它检查源码和资源，不证明功能或视觉合格。随后从 Skill 目录运行：

```powershell
node scripts/audit_interface.mjs path/to/app path/to/evidence
```

脚本需要运行环境可解析 `playwright` 或 `@playwright/test`，以及已安装浏览器。Windows默认Edge，可设置PIANO_BROWSER_CHANNEL。无法启动时报告“未执行浏览器验收”，不能写通过。脚本打开file页面并保存四个尺寸截图和JSON报告，检查真实DOM数量、桌面区域顺序、几何尺寸、背景、真实曲库按钮及溢出；它不代替人工看图和音乐行为验证。

逐张查看2560×1440、1920×1080、1366×768、390×844截图，确认布局密度、黑白键、控件、文本、弹窗。另实际操作表中每一行，记录步骤、预期、实际结果及未测项。不能把源码里出现字符串、隐藏template节点、存在某个ID、或测试了参考应用当成新页面验收。

交付应用目录、数据/映射报告、四尺寸截图、操作记录。任何未通过项必须修复或明确报告阻塞；不得宣称“与基准一致”而没有截图核对。3D只有用户要求时追加，不替代默认2D工作台。

用户明确指定其他主题时，默认审计中的颜色/尺寸失败应记录为“获授权的基准偏离”，另按用户规格核对截图；不能把默认审计结果改写为通过。键数、模式、同步、音频、数据完整性和离线要求仍须逐项通过。
