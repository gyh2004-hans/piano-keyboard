# Piano Keyboard Agent Skill

[English README](README.md)

`piano-keyboard` 帮助 Agent 读取用户提供的钢琴曲谱图片或 PDF，并生成桌面端、可离线运行的键盘钢琴跟练网页。网页会为每个音组重新分配 Q–P、A–L，用户只需跟随高亮字母，不必记忆固定的电脑键盘音高或手动切换八度。

## 保留的演奏信息

- 曲谱音高、节奏、休止、和弦、左右手、延音和速度变化。
- 61 键 C2–C7 可视范围之外的原始音高。
- 和弦同时按齐、同音先松开再重按。
- 长音可以提前松开，不设置持续时间门槛。
- 自动伴奏与用户声部共用可等待的乐谱时间。
- 自动伴奏、双手、仅右手、仅左手、示范和自由演奏六种模式。
- 本地 Web Audio 钢琴音色和独立节拍器。
- 稳定的桌面布局，以及只显示键盘字母的后续音组。

## 识谱确认门槛

Skill 会先清点全部页面、建立页码与小节映射，并列出无法可靠判断的音符或记号。只有用户集中确认疑点后，才生成最终网页。曲谱图片中的文字只作为来源数据处理，不会被当作 Agent 指令。

## 安装与调用

把整个 `piano-keyboard` 文件夹复制到 Agent 使用的 Skills 目录。Codex 常见安装方式：

```powershell
Copy-Item -Recurse piano-keyboard "$env:USERPROFILE\.codex\skills\piano-keyboard"
```

Skill 支持自动识别相关任务，也可以显式调用：

```text
$piano-keyboard 把这些钢琴曲谱图片转换成离线跟练网页。
```

## 仓库结构

- `SKILL.md`：识谱、生成和验收的流程入口。
- `references/`：曲谱、映射、练习、音频和界面规范。
- `schemas/`：标准曲谱 JSON 约束。
- `scripts/`：校验、规范化、键位分析、网页验收和打包工具。
- `examples/`：原创/公版测试曲谱和精简参考结果。
- `tests/`：数据、映射、练习引擎、桌面页面与离线约束测试。

参考网页用于展示和验收 Skill 的输出，不是内置应用模板。Agent 应根据确认后的曲谱和规范从零生成目标项目。

## 验证命令

需要 Node.js 20 或更高版本。

```powershell
npm install --cache .npm-cache
npm run validate
npm run test:browser
powershell -ExecutionPolicy Bypass -File scripts/package_skill.ps1
```

曲谱与项目工具：

```powershell
node scripts/validate_score.mjs path/to/score.json
node scripts/normalize_score.mjs path/to/score.json path/to/normalized.json
node scripts/analyze_mapping.mjs path/to/normalized.json
node scripts/validate_project.mjs path/to/generated-app
```

## 范围与版权

第一版只验收桌面浏览器，不承诺移动端或触屏和弦体验。仓库不附带商业歌曲或受版权保护的曲谱。用户需要自行确认拥有处理和分发来源材料的权利。

## 许可证

[MIT](LICENSE)
