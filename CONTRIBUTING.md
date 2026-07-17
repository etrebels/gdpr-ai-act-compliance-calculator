# Contributing

Thanks for your interest in improving these tools.

## Ground rules

- **Bug fixes and calculator improvements are welcome.** Open an issue describing the problem or the model change first, so we can agree on the approach before you write code.
- **Keep the packages dependency-free.** The calculators are pure TypeScript with zero runtime dependencies; please keep them that way.
- **No real pricing.** All shipped figures are illustrative placeholders. Do not add pricing that reflects a real vendor's quotes.
- **Types must pass.** Run `npm run typecheck` before opening a PR.

## Workflow

1. Fork the repo and create a branch.
2. Make your change with a clear commit message (imperative mood).
3. Run `npm run typecheck`.
4. Open a pull request describing what changed and why.

## Scope

This repository is the **calculation engine and shared UI** for LangOptima's free tools. It intentionally does not include lead capture, analytics, or the hosted application. PRs adding those are out of scope.
