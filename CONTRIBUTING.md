# Contributing

Thank you for improving Intent Clarifier. Keep contributions focused on clearer behavior, safer assumptions, better trigger boundaries, or stronger examples.

## Before Opening an Issue

- Remove names, credentials, private conversations, company information, and personal paths.
- Reduce the report to the smallest synthetic prompt that reproduces the behavior.
- Keep evaluation prompts synthetic and broaden contexts without claiming demographic representativeness.
- Search existing issues before creating a new one.
- Use GitHub private vulnerability reporting for security-sensitive findings.

## Pull Requests

1. Explain the behavior being changed and why it improves the skill.
2. Add or update a case in `evals/cases.yaml` for behavior changes.
3. Keep `SKILL.md` concise and move detailed guidance to a direct reference file.
4. Do not add a runtime, network dependency, connector, MCP server, hook, telemetry, or persistence layer.
5. Keep documentation links on approved HTTPS hosts without tracking parameters. Update the URL-policy tests when a new host is genuinely required.
6. Run the validation suite.

```bash
npm ci
npm test
```

By submitting a contribution, you agree that it is licensed under the repository's MIT License.
