# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| Earlier versions | No |

## Security Model

Intent Clarifier is an instruction-only skill, not a security boundary. It has no runtime, network client, credential store, account system, telemetry, or persistent data store. Its remaining attack surface is primarily behavioral and supply-chain related:

- prompt injection or instruction override attempts;
- unintended activation by a host that ignores invocation metadata;
- disclosure requests for hidden reasoning or unseen host instructions;
- malicious or tracked links introduced through documentation changes;
- compromised validation or automation dependencies.

The repository uses defense in depth:

- metadata disables implicit invocation and the skill repeats the explicit-invocation gate;
- embedded instructions are treated as untrusted task data;
- outputs use concise rationale instead of hidden chain-of-thought;
- CI validates trusted URL hosts, tracking parameters, repository metadata, credentials, runtime boundaries, and synthetic behavior cases;
- the lockfile preserves dependency integrity while Dependabot monitors npm and GitHub Actions updates.

These controls reduce risk but cannot technically force an LLM to comply or sanitize the host's input. Host instruction hierarchy, model behavior, access controls, privacy settings, and retention policy remain outside this repository's control.

## Reporting a Vulnerability

Use [GitHub private vulnerability reporting](https://github.com/tensely0228/intent-clarifier/security/advisories/new) for findings that could expose sensitive information, cause unsafe instruction behavior, or weaken the repository's privacy boundaries.

Do not include real credentials, private conversations, personal data, or confidential company information in an issue or test case. Use a minimal synthetic reproduction.

The repository is instruction-only and intentionally contains no model runtime, external service, connector, MCP server, hook, telemetry, or persistent data store.
