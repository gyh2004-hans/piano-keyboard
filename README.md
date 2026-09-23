<p align="center"><img src="docs/assets/hero.svg" alt="Piano Keyboard：从曲谱到离线钢琴跟练网页" width="100%"></p>

<p align="center"><strong>把曲谱变成可弹、可测、可离线使用的钢琴跟练网页。</strong></p>
<p align="center"><strong>简体中文</strong> · <a href="README.en.md">English</a></p>

## 快速开始

```bash
npx skills add gyh2004-hans/piano-keyboard
```

将曲谱图片或 PDF 交给 Agent，调用 `$piano-keyboard`。Skill 会引导识谱确认、数据建模、键位映射、离线页面实现与验收。

<p align="center"><img src="docs/assets/piano-keyboard-demo.gif" alt="公版二维参考应用：流水线、键盘高亮与 61 键钢琴" width="100%"></p>

## 核心能力

| 从曲谱到演奏 | 交付标准 |
|:---|:---|
| 识谱与确认 | 清点全部页面，集中确认模糊音符和节奏 |
| 键位与跟练 | 35 键半音布局、自动音区、流水线提示、61 键钢琴 |
| 声音与进度 | 本地合成音色、自动伴奏、和弦与长音判定 |
| 离线验收 | 数据、映射、状态机和真实浏览器检查 |

参考应用位于 [examples/generated-app](examples/generated-app)，用于观察二维跟练行为；它不是需要直接复制的产品模板。

## 可选 3D 演奏室

用户需要 3D 钢琴时，按 [3D 扩展规范](references/3d-piano.md)接入现有页面：

- 61 个独立琴键与二维页面共用 35 键映射；琴体提供象牙白、曜石黑两款。
- 暖棕色舞台默认关闭环境灯；开关同步调整背景与场景光。
- 赤橙黄绿青蓝紫音轨线覆盖全部琴键，按键时随时长垂直生长，松开后保持长度上升。

3D 扩展同样保持离线运行，并保留原跟练进度。

## 安装与更新

| 用途 | 命令 |
|:---|:---|
| 更新当前安装 | `npx skills update piano-keyboard` |
| 安装到 Codex 全局目录（Windows，复制模式） | `npx skills add gyh2004-hans/piano-keyboard --skill piano-keyboard --agent codex --global --copy --yes` |
| 更新全局安装 | `npx skills update piano-keyboard -g -y` |

完整参数见 [Skills CLI 文档](https://skills.sh/docs/cli)。

## 工作与验证

1. 清点原谱并确认不确定的读谱结果。
2. 规范化曲谱副本；保留源谱音高，分析共享音区、左右手音区和补充键。
3. 实现本地 HTML、CSS、JavaScript 与 Web Audio；校验提示、高亮、发声和练习进度一致。
4. 在桌面浏览器检查交互、音频、暂停/重置和 `file://` 离线打开。

```powershell
npm ci
npm run validate
npm run test:browser -- --reporter=line
node scripts/validate_project.mjs path/to/generated-app
```

规范从 [SKILL.md](SKILL.md) 进入；细节见 [references/](references/)，数据格式见 [schemas/](schemas/)。仓库只提供通用 Skill、工具和公版示例，不包含用户的商业曲谱或当前工作区的成品应用。

代码与文档使用 [MIT License](LICENSE)；第三方曲谱仍需单独确认使用与分发权限。
