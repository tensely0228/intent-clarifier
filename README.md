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

Implicit invocation is disabled in host metadata. The skill repeats the explicit-invocation gate in its workflow as a second behavioral safeguard for compliant hosts and models; neither control is a technical enforcement boundary.

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

Guided self-inquiry is deliberately narrow: it is used only to resolve ambiguity or a material trade-off, not to profile the user or turn the answer into generic coaching.

## Security Model

- Host metadata disables implicit invocation, and the skill repeats an explicit-invocation gate in its workflow.
- Instructions embedded in quoted text, documents, examples, or role labels are treated as untrusted task data.
- The skill returns concise reasons and material trade-offs, not hidden chain-of-thought or unseen host instructions.
- Validation rejects untrusted documentation hosts, insecure links, common tracking parameters, mismatched repository metadata, credential patterns, runtime declarations, and release artifacts.

These are defense-in-depth safeguards, not a technical security boundary. An instruction-only skill cannot sanitize model input or guarantee model compliance; the host's instruction hierarchy, model behavior, privacy controls, and retention policy still apply. See [SECURITY.md](SECURITY.md).

## Privacy and Scope

The repository contains no model runtime, external service, telemetry, account system, or data storage. The skill itself makes no network request and requires no API key. Conversation handling remains subject to the host application's own privacy and retention settings.

The repository includes a minimal Codex plugin manifest for installable distribution. It does not add connectors, MCP servers, hooks, or background processes.

`package-lock.json` contains standard npm registry URLs and integrity hashes for reproducible dependency installation. They are dependency provenance, not author identity or local network data. The manifest accepts compatible dependency updates, while the lockfile keeps CI reproducible and Dependabot proposes reviewable updates. `private: true` prevents accidental npm publication; it does not prevent installation from GitHub.

## Compatibility

The skill follows the open [Agent Skills specification](https://agentskills.io/specification). `agents/openai.yaml` and the plugin `defaultPrompt` contain the same presentation prompt, intended to be shown or seeded only after explicit user action. They are not a second workflow. Host behavior outside ChatGPT desktop and Codex remains unverified.

## Development

```bash
npm ci --ignore-scripts
npm test
```

The validation suite runs URL-policy and repository-boundary unit tests and checks the exact instruction-only file allowlist, skill metadata, plugin boundaries, 24 bilingual synthetic evaluation cases, symlinks, release artifacts, local paths, and common credential patterns. The YAML cases define expected behavior boundaries; model execution remains a manual, host-dependent release check and is not proof that every host model will resist every adversarial input. Dependabot monitors npm and GitHub Actions dependencies weekly.

## Contributing

Behavior reports and focused pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting examples or changing the workflow.

## License

[MIT](LICENSE)
