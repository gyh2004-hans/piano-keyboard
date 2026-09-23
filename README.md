<p align="center">
  <img src="docs/assets/hero.svg" alt="Piano Keyboard：从钢琴曲谱到离线跟练网页" width="100%">
</p>

<p align="center"><strong>把钢琴曲谱变成真正可弹、可测、可离线运行的键盘跟练网页。</strong></p>

<p align="center">
  <a href="README.md"><strong>简体中文</strong></a> ·
  <a href="README.en.md">English</a>
</p>

<p align="center">
  <img alt="Skill version 2.0.0" src="https://img.shields.io/badge/Skill-v2.0.0-315c49?style=flat-square">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-c89b52?style=flat-square">
  <img alt="Offline output" src="https://img.shields.io/badge/Output-Offline-7fa36a?style=flat-square">
  <img alt="Node.js 20 or newer" src="https://img.shields.io/badge/Node.js-20%2B-315c49?style=flat-square">
</p>

<p align="center">
  <a href="#一条命令开始">快速开始</a> &nbsp;·&nbsp;
  <a href="#真实效果">效果演示</a> &nbsp;·&nbsp;
  <a href="#安装与更新">安装与更新</a> &nbsp;·&nbsp;
  <a href="#开发与验证">开发指南</a>
</p>

---




<p align="center">
  <img src="docs/assets/piano-keyboard-demo.gif" alt="Piano Keyboard 真实参考应用：流水线、键盘高亮与 61 键钢琴同步演示" width="100%">
</p>


## 它解决什么问题

| 能力 | 你会得到 |
|:---|:---|
| **识谱确认** | 完整页面清点、双手与节奏识别，疑点集中确认 |
| **键位映射** | 固定 35 键半音布局，左右手自动切换音区 |
| **离线跟练** | 流水线提示、四排键盘高亮、61 键钢琴与伴奏 |
| **交付验收** | 数据校验、映射分析、状态机与真实浏览器检查 |

输出是纯本地 HTML/CSS/JavaScript 与 Web Audio 应用，没有运行时网络依赖。仓库提供的是 Agent Skill、规范、工具、测试和公版参考应用，不是独立 OCR 服务，也不附带商业曲谱。

## 可选 3D Piano 模块

需要立体演奏视图时，可在原有离线跟练网页中加入 3D 钢琴，同时保留二维练习进度。它沿用主页面的 35 键映射，提供 61 个可弹奏琴键、象牙白与曜石黑外观，以及棕色舞台；环境灯默认关闭。每个琴键对应从左红到右紫的彩虹音轨线，按住越久线条越长，松开后垂直向上消散。实现与验收要求见 [3D Piano 扩展规范](references/3d-piano.md)。

## 安装与更新

### 通用方式

| 场景 | 命令 |
|---|---|
| 安装 | `npx skills add gyh2004-hans/piano-keyboard` |
| 更新当前安装 | `npx skills update piano-keyboard` |
| 更新项目级安装 | `npx skills update piano-keyboard -p -y` |
| 更新全局安装 | `npx skills update piano-keyboard -g -y` |

`-p` 指定项目级范围，`-g` 指定全局范围，`-y` 跳过交互确认。`skills update` 适用于由 Skills CLI 安装并记录的 Skill；完整参数以 [Skills CLI 文档](https://skills.sh/docs/cli) 为准。

### Codex + Windows

如果希望在 Codex 中全局使用，并通过复制文件避免符号链接权限问题：

```bash
npx skills add gyh2004-hans/piano-keyboard --skill piano-keyboard --agent codex --global --copy --yes
```

之后使用全局更新：

```bash
npx skills update piano-keyboard -g -y
```

## 推荐提示词

```text
$piano-keyboard 识别我上传的全部曲谱页面，先集中列出不确定内容供我确认。
确认后生成离线 PC 跟练网页：使用 35 键半音映射和自动音区；中心从上到下显示
流水线、四排键盘高亮和 61 键钢琴；保留和弦、长音、自动伴奏、速度和统计功能。
完成后运行数据、映射和真实浏览器验收，并报告仍存在的限制。
```

## 从曲谱到可交付网页

**01 识谱确认 → 02 数据建模 → 03 键位映射 → 04 离线实现 → 05 验收交付**

| 阶段 | 交付要求 |
|---|---|
| 识谱 | 不跳页、不猜测模糊记号，保留来源与不确定性记录 |
| 数据 | 规范化副本，不原地修改原始曲谱数据 |
| 映射 | 报告共享/双手音区、锁定、补充键和无法覆盖的音组 |
| 实现 | 本地资源、Web Audio、可复制目录、无运行时 CDN |
| 验收 | 数据、映射、状态机、桌面布局、音频与关键交互均有证据 |

## v2 行为契约

35 键覆盖连续半音，61 键钢琴保留完整演奏视图；宽跨度音组允许左右手独立换区。

<details>
<summary><strong>展开键位布局与映射规则</strong></summary>


页面保留完整四排实体键盘外观：

```text
1 2 3 4 5 6 7 8 9 0 - =
 Q W E R T Y U I O P [ ]
  A S D F G H J K L ; '
   Z X C V B N M , . /
```

其中标准半音序列为：

```text
Q 2 W 3 E R 5 T 6 Y 7 U I 9 O 0 P Z S X D C F V B H N J M , L . ; / '
```

- 35 个标准键在切换音区前覆盖 MIDI 48–82。
- 优先整体切换一个八度音区；跨度过大时允许左右手分别切换。
- 实体键被按住期间锁定原音高，切换映射不会造成跳音。
- `A G K 1 4 8` 只在标准键数学上无法覆盖时作为补充键，并必须显式报告。
- 不为迁就键盘而静默移调、删音或改写源谱。

算法与示例见 [键位映射规范](references/keyboard-mapping.md)。

</details>

### 一个提示源，三处完全一致

当前流水线字符是唯一的可见目标集合。流水线字母、中间键盘高亮和实际要求用户按下的键必须逐字符相同。

自动伴奏可以发声，但不能多亮键；上一音组延续的长音也不能泄漏到下一组提示。回归模式与 DOM 集合断言见 [提示一致性规范](references/prompt-consistency.md)。

### 练习判定

| 行为 | 规则 |
|---|---|
| 和弦 | 从第一个正确起音开始，必须在 **120ms（含边界）** 内按齐 |
| 错音 | 正常发声并计入尝试与错误，但不推进当前音组 |
| 长音 | 只判定起音；成立后可立即松开，不扣分、不等待、不冻结谱面时间 |
| 连续同音 | 必须先松开，再重新按下 |

完整状态转换见 [练习引擎规范](references/practice-engine.md)。



## 开发与验证

要求 Node.js 20+、PowerShell 与可用的 Playwright 浏览器。

<details>
<summary><strong>展开开发、测试与数据校验命令</strong></summary>


```powershell
npm ci
npm run validate
npm run test:browser -- --reporter=line
powershell -ExecutionPolicy Bypass -File scripts/package_skill.ps1
```

单独检查数据或生成项目：

```powershell
node scripts/validate_score.mjs path/to/score.json
node scripts/normalize_score.mjs path/to/score.json path/to/normalized.json
node scripts/analyze_mapping.mjs path/to/normalized.json
node scripts/validate_project.mjs path/to/generated-app
```

公版/合成参考应用位于 [examples/generated-app](examples/generated-app)。它用于观察行为和运行验收，不应被整页复制到用户项目。

</details>

## 文档与仓库导航

| 路径 | 用途 |
|---|---|
| [SKILL.md](SKILL.md) | Agent 路由、执行顺序与不可违反的产品约束 |
| [references/](references/) | 识谱、映射、状态机、提示、界面、音频与验收细则 |
| [schemas/](schemas/) | 曲谱 JSON Schema |
| [scripts/](scripts/) | 校验、规范化、映射分析、打包与本地安装工具 |
| [tests/](tests/) | 单元测试与真实浏览器测试 |

## 范围与许可

首要范围是桌面浏览器。390px 仅验证无页面级横向溢出，不代表完整移动端演奏支持。用户需要自行确认源曲谱的处理与分发权限。

代码与文档采用 [MIT License](LICENSE)。该许可证不授予任何第三方歌曲或曲谱版权。

---

<p align="center"><sub>Bring the score. Follow the flow. Play it.</sub><br>
<a href="#一条命令开始">开始安装</a> · <a href="LICENSE">MIT License</a></p>
