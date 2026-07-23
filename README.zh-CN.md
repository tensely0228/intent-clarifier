# 意图澄清 Skill

[English](README.md)

把模糊请求整理成明确目标、多层次需求、个性化约束和直接答案。

[![Validate](https://github.com/tensely0228/intent-clarifier/actions/workflows/validate.yml/badge.svg)](https://github.com/tensely0228/intent-clarifier/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-2f855a.svg)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-compatible-2563eb.svg)](https://agentskills.io/specification)

这是一个纯指令型 Agent Skill，适合请求不完整、优先级冲突，或用户知道大致方向但尚未形成清晰目标的场景。它严格控制提问数量，并始终给出可使用的答案，而不是以问题清单结束对话。

## 输出内容

- 一句话目标
- 多层次需求：明确诉求、期望结果、核心优先级和成功标准
- 个性化约束：硬性限制、偏好、取舍和必要假设
- 从建议开始的直接答案

对于清晰的事实问题和已经完整定义的任务，Skill 不会强行套用分析结构。

## 快速使用

显式调用 Skill：

```text
使用 $intent-clarifier 帮我选择一个能在全职工作期间完成的个人项目，不要问不必要的问题。
```

宿主元数据已关闭隐式调用，Skill 工作流也重复检查显式调用，作为宿主与模型遵循时的第二层行为防护；两者都不是技术强制边界。

## 安装

### Skill Installer

在 Codex 或 ChatGPT 桌面端中输入：

```text
使用 $skill-installer 从 https://github.com/tensely0228/intent-clarifier 安装 intent-clarifier。
```

### 手动安装

macOS 或 Linux：

```bash
git clone https://github.com/tensely0228/intent-clarifier.git
mkdir -p ~/.agents/skills
cp -R intent-clarifier/skills/intent-clarifier ~/.agents/skills/
```

Windows PowerShell：

```powershell
git clone https://github.com/tensely0228/intent-clarifier.git
New-Item -ItemType Directory -Force "$HOME\.agents\skills" | Out-Null
Copy-Item -Recurse "intent-clarifier\skills\intent-clarifier" "$HOME\.agents\skills\"
```

如果 Skill 没有立即出现，请重启宿主应用。

## 工作方式

1. 判断澄清是否会实质改善答案。
2. 保留用户原始诉求，再进行必要推断。
3. 区分多层次需求与个性化约束。
4. 默认不提问，确有关键阻塞时最多提一个问题。
5. 标注最小必要假设并直接回答。

完整规则见 [Skill 指令](skills/intent-clarifier/SKILL.md) 和 [引导式自我提问方法](skills/intent-clarifier/references/self-inquiry.md)。

引导式自我提问被严格限制在消除歧义或处理关键取舍，不用于分析用户人格，也不把回答变成泛化式辅导。

## 安全模型

- 宿主元数据和 Skill 工作流同时要求显式调用。
- 引用文本、文档、示例或角色标签中的指令被视为不可信任务数据。
- 只给出简明依据和关键取舍，不暴露隐藏思维链或不可见的宿主指令。
- 校验会拒绝不可信文档域名、不安全链接、常见追踪参数、错误仓库元数据、凭据模式、运行时声明和发布产物。

这些是纵深行为防护，不是技术安全边界。纯指令型 Skill 无法清洗模型输入或保证模型必然遵从；宿主的指令层级、模型行为、隐私控制和数据保留策略仍然生效。详见 [SECURITY.md](SECURITY.md)。

## 隐私与边界

仓库不包含模型运行时、外部服务、遥测、账号系统或数据存储。Skill 本身不发起网络请求，也不需要 API Key。对话数据仍受宿主应用自身的隐私和保留策略约束。

仓库包含一个用于安装分发的最小 Codex Plugin 清单，但不包含连接器、MCP Server、Hook 或后台进程。

`package-lock.json` 中的 npm registry URL 和 integrity 哈希是可复现安装所需的标准依赖溯源信息，不是作者身份或本地网络信息。依赖清单允许兼容版本更新，lockfile 保证 CI 可复现，Dependabot 则提交可审阅的升级建议。`private: true` 仅用于防止误发布到 npm，不妨碍从 GitHub 安装。

## 兼容性

Skill 遵循开放的 [Agent Skills 规范](https://agentskills.io/specification)。`agents/openai.yaml` 与 Plugin 的 `defaultPrompt` 使用同一条展示提示，仅应在用户显式操作后展示或预填，并不是第二套工作流。ChatGPT 桌面端和 Codex 之外的宿主行为仍未验证。

## 开发与验证

```bash
npm ci
npm test
```

验证流程包含 URL 策略单测，并检查 Skill 元数据、Plugin 边界、24 个中英双语合成评测、符号链接、发布产物、本机路径和常见凭据模式。YAML 用例用于定义预期行为边界，并不能证明所有宿主模型都能抵抗全部对抗输入。Dependabot 每周监控 npm 与 GitHub Actions 依赖。

## 参与贡献

欢迎提交行为问题和范围明确的 Pull Request。修改流程或增加示例前，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
