<p align="center">
  <img src="docs/assets/hero.svg" alt="Piano Keyboard：把曲谱变成两排键的钢琴练习" width="100%">
</p>

<h1 align="center">Piano Keyboard</h1>

<p align="center"><strong>读入一份曲谱，跟着字母，把音乐弹出来。</strong></p>
<p align="center">面向 AI Agent 的钢琴跟练 Skill · 自动配键 · 桌面离线网页</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-327758?style=flat-square" alt="MIT License"></a>
  <a href="SKILL.md"><img src="https://img.shields.io/badge/Agent-Skill-327758?style=flat-square" alt="Agent Skill"></a>
  <a href="https://skills.sh/docs/cli"><img src="https://img.shields.io/badge/install-npx_skills-B18A43?style=flat-square" alt="Install with npx skills"></a>
</p>

<p align="center"><strong>简体中文</strong> · <a href="README.en.md">English</a></p>
<p align="center"><a href="#快速安装">快速安装</a> · <a href="#从曲谱到练习">使用流程</a> · <a href="#两排键如何承载一首歌">配键方式</a> · <a href="#开发与验证">开发与验证</a></p>

---

## 让手指专注于音乐

`piano-keyboard` 帮助 Agent 识别你提供的钢琴曲谱图片或 PDF，将确认后的曲谱转换成桌面端跟练网页。演奏只使用 **Q–P、A–L 两排共 19 个字母键**，当前需要弹奏的按键会高亮；弹对当前音组，继续下一组。

它是一套**给 Agent 使用的工作流程、设计规范和验证工具**。识谱需要具备图片理解能力的 Agent，PDF 还需要相应的读取工具；仓库不包含独立 OCR 服务。附带网页是精简参考结果，完整练习页面由 Agent 按曲谱生成。

## 快速安装

已安装 Node.js 和 npm 后，在希望使用 Skill 的项目目录打开终端：

```bash
npx skills add gyh2004-hans/piano-keyboard
```

通过 [Skills CLI](https://skills.sh/docs/cli) 从 GitHub 安装，按提示选择 Agent 和安装范围。仓库根目录的 `SKILL.md` 就是安装入口，无需另外发布 npm 包。

<details>
<summary><strong>Codex 专用命令、全局安装与检查</strong></summary>

安装到当前项目，使用复制方式，避免 Windows 符号链接权限问题：

```bash
npx skills add gyh2004-hans/piano-keyboard --skill piano-keyboard --agent codex --copy --yes
```

需要跨项目使用时，增加 `--global`：

```bash
npx skills add gyh2004-hans/piano-keyboard --skill piano-keyboard --agent codex --global --copy --yes
```

只检查远程仓库能否识别，不安装：

```bash
npx skills add gyh2004-hans/piano-keyboard --list
```

`npx` 安装需要联网；生成后的练习网页按规范使用本地资源，离线运行。其他 Agent 的安装选项见 [Skills CLI 文档](https://github.com/vercel-labs/skills#options)。

</details>

### 开始第一首练习

安装后，在支持 Skills 的 Agent 中附上曲谱并发送：

```text
$piano-keyboard 请识别我上传的全部钢琴曲谱页面，集中列出不确定的音符或记号。
确认后生成桌面离线跟练网页：仅使用 Q–P、A–L 自动配键，保留和弦与长音，
后续音组显示键盘字母，并保持休止、等待和演奏状态下的页面高度稳定。
```

## 从曲谱到练习

| 步骤 | Agent 做什么 | 你会得到什么 |
| :--- | :--- | :--- |
| **01 · 读谱** | 整理页序、小节、双手声部、音高、时值和速度变化 | 页面清单与识谱疑点报告 |
| **02 · 确认** | 集中呈现无法可靠判断的内容，待确认后规范化数据 | 可校验的曲谱 JSON |
| **03 · 配键** | 按当前音组分配字母键，检查和弦、占用键与跨度 | 配键分析；必要时列明简化方案 |
| **04 · 生成** | 根据规范生成 HTML、CSS、JavaScript 和本地音频逻辑 | 可从本地打开的桌面练习网页 |
| **05 · 验证** | 检查数据、交互、布局稳定性与离线依赖 | 验证报告及完整交付文件 |

曲谱中的文字仅作为来源数据处理。无法辨认的内容需要确认，不应通过猜测补全。

## 两排键如何承载一首歌

```text
Q  W  E  R  T  Y  U  I  O  P
 A  S  D  F  G  H  J  K  L
```

**字母位置固定，音高按曲目自动分配。** 同一个字母在不同音组可以承担不同的音高，手指不必手动切换八度。默认始终使用钢琴音色；自动配键改变的是音高绑定。

| 规则 | 演奏体验 |
| :--- | :--- |
| 优先常用指位 | 优先分配 ASDF、JKL、P 等位置，减少伸手和复杂组合 |
| 保留空间顺序 | 尽可能低音在左、高音在右，双手模式按左右区域分工 |
| 按住期间锁定 | 已按下的键保持原音高，松开后才允许重新分配 |
| 和弦完整保留 | 需要同时按齐对应字母，不把和弦悄悄变成单音 |
| 长音跟随手指 | 按住发声，提前松开即结束；无最低秒数、倒计时或惩罚等待 |
| 提示保持一致 | 当前与后续音组显示字母；未来配键会随实际占用状态更新 |

这是一套面向打字键盘的操作约定，不等同于钢琴指法训练。普通键盘的多键同时输入能力存在差异；无法完成的组合应重新配键，必要的曲谱简化须明确说明。

## 页面与练习规范

**沿用紧凑的桌面三栏布局，让演奏区域始终居中。**

| 左侧 · 选曲 | 中间 · 演奏 | 右侧 · 设置 |
| :--- | :--- | :--- |
| 曲目列表、简短引导 | 进度、当前提示、字母队列、两排键盘 | 模式、段落、速度、操作说明 |
| 明确当前曲目 | 61 键音域参考、统计与示范控制 | 可独立开关的节拍器 |

生成页面须满足：

- **稳定布局**：和弦、单音、休止、等待、完成状态保持提示区域尺寸稳定。
- **六种模式**：自动伴奏、双手、仅右手、仅左手、示范、自由演奏。
- **跟随式练习**：到达下一次必弹起音且尚未弹齐时暂停乐谱时间；伴奏共用同一时间线。
- **原音高保留**：以 C2–C7 的 61 键范围作参考，超出显示范围的音仍按原音高发声；八度适配应明确标注。
- **本地音频**：Web Audio 钢琴合成，运行时不依赖远程音源；节拍器独立于计分和配键。
- **桌面可用性**：可见焦点、清晰状态文字、不只依赖颜色，尊重减少动画设置。

详细规则见 [界面设计](references/interface-design.md)、[配键规范](references/keyboard-mapping.md) 与 [练习引擎](references/practice-engine.md)。

## 仓库导航

| 路径 | 用途 |
| :--- | :--- |
| [SKILL.md](SKILL.md) | Agent 的流程入口与必须遵循的交互规则 |
| [references/](references/) | 识谱、界面、配键、练习、音频与验收规范 |
| [schemas/](schemas/) | 曲谱 JSON 的结构约束 |
| [scripts/](scripts/) | 曲谱校验、规范化、配键分析、网页检查和打包工具 |
| [examples/](examples/) | 原创／公版测试曲谱与精简参考网页 |
| [tests/](tests/) | 数据、映射、练习状态和浏览器检查 |

## 开发与验证

以下命令供维护者使用；**安装 Skill 无需克隆仓库或运行测试**。

<details>
<summary><strong>克隆、验证和打包</strong></summary>

需要 Node.js 20+；打包脚本使用 PowerShell。

```bash
git clone https://github.com/gyh2004-hans/piano-keyboard.git
cd piano-keyboard
npm ci
npm run validate
npx playwright install chromium
npm run test:browser
```

Linux 若缺少浏览器系统依赖，可使用 `npx playwright install --with-deps chromium`。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package_skill.ps1
```

在 macOS／Linux 安装 PowerShell 后，使用 `pwsh -File scripts/package_skill.ps1`。输出为 `dist/piano-keyboard.zip`。

</details>

<details>
<summary><strong>独立曲谱与网页检查命令</strong></summary>

```bash
node scripts/validate_score.mjs path/to/score.json
node scripts/normalize_score.mjs path/to/score.json path/to/normalized.json
node scripts/analyze_mapping.mjs path/to/normalized.json
node scripts/validate_project.mjs path/to/generated-app
```

自动检查覆盖部分结构和行为，完整曲目仍需按 [验收清单](references/quality-checklist.md) 检查实际演奏。

</details>

## 范围与许可

当前面向**桌面浏览器**，暂不适配移动端；输入为曲谱图片、PDF 或规范化曲谱数据，不包含音频扒谱。仓库不附带商业歌曲曲谱，来源材料的处理与分发权限由使用者确认。

项目代码与文档采用 [MIT License](LICENSE)。该许可证不授予第三方曲谱或歌曲的使用权。

<p align="center"><sub>不着急，一键一键来。</sub></p>
