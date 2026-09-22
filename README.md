<p align="center"><img src="docs/assets/hero.svg" alt="Piano Keyboard：35 键半音映射与流水线钢琴跟练" width="100%"></p>

<h1 align="center">Piano Keyboard</h1>
<p align="center"><strong>读入曲谱，跟随流水线字符，在电脑键盘上弹奏。</strong></p>
<p align="center">Agent Skill · 固定 35 键半音布局 · 自动音区 · 桌面离线网页</p>

<p align="center"><a href="README.md"><strong>简体中文</strong></a> · <a href="README.en.md">English</a></p>

---

## 这是什么

`piano-keyboard` 指导 Agent 从钢琴曲谱图片、PDF 或结构化数据生成离线跟练网页。v2 使用固定的 35 键半音布局，按音组自动切换共享或左右手独立八度；上方流水线、中间电脑键盘高亮和下方 61 键钢琴保持同步。

仓库提供 Agent 工作流、数据 Schema、可执行映射/练习模型、参考应用和自动化验收。它不是独立 OCR 服务，也不包含商业曲谱。

## 快速安装

```bash
npx skills add gyh2004-hans/piano-keyboard
```

Codex 在 Windows 上可使用复制安装：

```bash
npx skills add gyh2004-hans/piano-keyboard --skill piano-keyboard --agent codex --global --copy --yes
```

安装后可这样请求：

```text
$piano-keyboard 识别我上传的全部曲谱页面，集中列出不确定内容。
确认后生成离线 PC 跟练网页：使用 35 键半音映射和自动音区，中心依次显示
流水线、四排键盘高亮、61 键钢琴；保留和弦、长音、伴奏、速度和统计功能。
```

## v2 核心契约

### 四排实体键盘，35 键标准映射

```text
1 2 3 4 5 6 7 8 9 0 - =
 Q W E R T Y U I O P [ ]
  A S D F G H J K L ; '
   Z X C V B N M , . /
```

标准半音序列为：

```text
Q 2 W 3 E R 5 T 6 Y 7 U I 9 O 0 P Z S X D C F V B H N J M , L . ; / '
```

- 35 个标准键覆盖连续 35 个半音，基准为 MIDI 48–82。
- 优先整体切换一个八度音区；跨度过大时允许左右手分别切换。
- 按住的实体键在松开前锁定原音高。
- `A G K 1 4 8` 只在数学上无法覆盖时作为补充键，并必须报告。
- 不为适配键盘而静默移调、删音或改写源谱。

### 一个可见提示源

流水线当前字符是唯一的可见目标集合。练习键盘的 `.target` 与示范键盘的 `.demo-note` 必须逐字符等于流水线当前组。

自动伴奏可以发声，但不能多亮键；上一组仍在延续的长音也不能泄漏到下一组提示。详细诊断见 [提示一致性](references/prompt-consistency.md)。

### 清晰的判定规则

- 和弦从第一个正确起音起，在 **120ms（含边界）** 内按齐。
- 错音会发声、计入尝试和错误，但不推进音组。
- 长音只判定起音；音组成立后可立即松开，不扣分、不等待、不冻结谱面时间。
- 连续同音必须松开后重新按下。

## 页面与功能

主视图以 2560×1440、16:9 PC 为首要目标：左侧是一次显示六首的非循环滚动曲库，中间从上到下为流水线、四排键盘、61 键钢琴，右侧为练习控制。

生成或修复现有项目时保留曲库、原谱查看、左右手/双手、自动伴奏、示范、自由演奏、小节范围、速度、暂停、重置、循环、音量、统计和独立节拍器等既有能力。

## 从曲谱到交付

| 阶段 | 必须完成 |
|---|---|
| 识谱 | 清点全部页面；记录小节、双手、音高、时值、连音、反复和速度；集中确认疑点 |
| 数据 | 校验 Schema，规范化且不修改原输入，保留来源与不确定性记录 |
| 映射 | 分析共享/双手音区、锁定、补充键和阻塞音组 |
| 实现 | 本地 HTML/CSS/JS 和 Web Audio；无运行时网络依赖 |
| 验收 | 单元测试、真实浏览器、Skill 校验、压缩包检查和安装副本校验 |

## 开发与验证

需要 Node.js 20+、PowerShell 和 Playwright 浏览器：

```powershell
npm ci
npm run validate
npm run test:browser -- --reporter=line
python C:/Users/24939/.codex/skills/.system/skill-creator/scripts/quick_validate.py .
powershell -ExecutionPolicy Bypass -File scripts/package_skill.ps1
```

独立数据命令：

```powershell
node scripts/validate_score.mjs path/to/score.json
node scripts/normalize_score.mjs path/to/score.json path/to/normalized.json
node scripts/analyze_mapping.mjs path/to/normalized.json
node scripts/validate_project.mjs path/to/generated-app
```

参考应用位于 [examples/generated-app](examples/generated-app)，包含合成/公版数据，仅用于观察和验收，不应整页复制。

## 仓库导航

| 路径 | 用途 |
|---|---|
| [SKILL.md](SKILL.md) | Agent 路由与不可违反的产品约束 |
| [references/](references/) | 识谱、映射、状态机、提示一致性、界面、音频和验收细则 |
| [schemas/](schemas/) | 曲谱 JSON 结构 |
| [scripts/](scripts/) | 校验、规范化、映射分析、打包和本地安装 |
| [tests/](tests/) | 单元与真实浏览器测试 |

## 范围与许可

首要范围是桌面浏览器；390px 只验证无页面级横向溢出，不等于完整移动端演奏支持。用户负责确认源曲谱的处理与分发权限。

代码与文档采用 [MIT License](LICENSE)，该许可证不授予第三方歌曲或曲谱版权。
