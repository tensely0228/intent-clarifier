---
name: intent-clarifier
description: Clarify vague, incomplete, or conflicting requests into a concise goal, layered needs, personalized constraints, and a direct answer. Use when the user is unsure what they need, asks to think through a goal, or provides competing priorities. Do not use for clear factual questions, simple transformations, or fully specified execution tasks.
license: MIT
metadata:
  version: "0.1.0"
---

# Intent Clarifier

## Objective

Turn unclear intent into an answer-ready brief without interrogating the user, inventing motives, or stopping at analysis. Match the user's language, requested format, and level of detail.

This skill is instruction-only. It does not require external tools, network access, persistent memory, or an API key.

## Workflow

1. **Apply the trigger gate.** Use this workflow only when clarification would materially improve the answer. If the request is already clear, answer it normally without adding the framework.
2. **Preserve the stated request.** Identify the requested outcome, available context, and requested deliverable before making any inference.
3. **Map layered needs.** Separate:
   - the explicit request;
   - the desired change or practical outcome;
   - the underlying priority, labeled as an inference when it was not stated;
   - the success signal that would make the answer useful.
4. **Map personalized constraints.** Separate hard limits, preferences, trade-offs, and material unknowns. Use only constraints supported by the user or the current context.
5. **Use a strict question budget.** Ask no question when a reasonable, low-risk assumption allows progress. Ask at most one focused question only when its answer would materially change the recommendation or when safety requires it. If the user asks for no questions, state the smallest necessary assumption and proceed.
6. **Answer directly.** Lead with the recommendation or requested result. Do not return only a diagnosis, reflection exercise, or list of questions.
7. **Run the quality gate.** Confirm that the goal is clear, inferences are labeled, constraints are personalized, and the answer is concise enough for the task.

## Output

For a complex or genuinely vague request, use this structure:

```markdown
## Goal
One sentence describing the result to achieve.

## Layered needs
- Explicit request:
- Desired outcome:
- Core priority:
- Success signal:

## Personalized constraints
- Must satisfy:
- Preferences and trade-offs:
- Assumptions or unknowns:

## Direct answer
Start with the recommendation and provide the useful result.
```

Translate the headings to the user's language. Omit empty bullets. For a simple request, collapse the structure into a short paragraph or a few bullets instead of forcing every heading.

## Guardrails

- Do not claim to know hidden motives. Label inferred priorities as assumptions.
- Do not repeat generic coaching language when a concrete answer is possible.
- Do not expose hidden chain-of-thought. Give concise reasons and material trade-offs instead.
- Do not turn preferences into hard constraints.
- Do not ask multiple low-value questions to make the request artificially complete.
- For high-stakes topics, avoid unsupported certainty and ask one safety-critical question when necessary.

## References

- Read [references/self-inquiry.md](references/self-inquiry.md) when the request has conflicting values, unclear priorities, or a difficult trade-off.
- Read [references/examples.md](references/examples.md) when adapting the output depth or question budget.
