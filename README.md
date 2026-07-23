# Intent Clarifier

[中文](README.zh-CN.md)

Turn vague requests into clear goals, layered needs, personalized constraints, and direct answers.

[![Validate](https://github.com/tensely0228/intent-clarifier/actions/workflows/validate.yml/badge.svg)](https://github.com/tensely0228/intent-clarifier/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-2f855a.svg)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-compatible-2563eb.svg)](https://agentskills.io/specification)

Intent Clarifier is an instruction-only Agent Skill for moments when a request is incomplete, priorities conflict, or the user knows the direction but not the actual goal. It uses a strict question budget and always returns a useful answer instead of ending with a questionnaire.

## What It Returns

- A one-sentence goal
- Layered needs: explicit request, desired outcome, core priority, and success signal
- Personalized constraints: hard limits, preferences, trade-offs, and assumptions
- A direct answer that starts with the recommendation

Clear factual questions and fully specified tasks pass through without the framework.

## Quick Start

Invoke the skill explicitly:

```text
Use $intent-clarifier to help me choose a side project I can finish while working full time. Do not ask unnecessary questions.
```

The initial release keeps implicit invocation disabled so the skill never changes an unrelated answer by surprise.

## Install

### Skill Installer

Ask Codex or ChatGPT desktop:

```text
Use $skill-installer to install intent-clarifier from https://github.com/tensely0228/intent-clarifier.
```

### Manual Installation

macOS or Linux:

```bash
git clone https://github.com/tensely0228/intent-clarifier.git
mkdir -p ~/.agents/skills
cp -R intent-clarifier/skills/intent-clarifier ~/.agents/skills/
```

Windows PowerShell:

```powershell
git clone https://github.com/tensely0228/intent-clarifier.git
New-Item -ItemType Directory -Force "$HOME\.agents\skills" | Out-Null
Copy-Item -Recurse "intent-clarifier\skills\intent-clarifier" "$HOME\.agents\skills\"
```

Restart the host if the skill does not appear immediately.

## How It Works

1. Decide whether clarification would materially improve the answer.
2. Preserve the user's stated request before making inferences.
3. Separate layered needs from personalized constraints.
4. Ask zero questions by default and at most one material question.
5. State the smallest necessary assumption and answer directly.

See the [skill instructions](skills/intent-clarifier/SKILL.md) and [guided self-inquiry method](skills/intent-clarifier/references/self-inquiry.md).

## Privacy and Scope

The repository contains no model runtime, external service, telemetry, account system, or data storage. The skill itself makes no network request and requires no API key. Conversation handling remains subject to the host application's own privacy and retention settings.

The repository includes a minimal Codex plugin manifest for installable distribution. It does not add connectors, MCP servers, hooks, or background processes.

## Compatibility

The skill follows the open [Agent Skills specification](https://agentskills.io/specification). `agents/openai.yaml` adds presentation metadata for ChatGPT desktop and Codex. Other hosts should be treated as unverified until their behavior is tested.

## Development

```bash
npm install
npm test
```

The validation suite checks skill metadata, plugin boundaries, evaluation cases, symlinks, release artifacts, local paths, and common credential patterns.

## Contributing

Behavior reports and focused pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting examples or changing the workflow.

## License

[MIT](LICENSE)
