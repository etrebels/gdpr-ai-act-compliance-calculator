# GDPR & EU AI Act Compliance Cost Calculator

**Open-source model for annual data-protection and AI-compliance exposure** — DSARs, data mapping, DPO cost, breach risk, and EU AI Act conformity. For DPOs, compliance and legal leads, and risk owners scoping the cost of staying compliant as AI enters regulated workflows.

▶ **Use the live tool:** [tools.langoptima.com/compliance-calculator](https://tools.langoptima.com/compliance-calculator)

The live version produces a saved, shareable report. This repo is the open calculation engine — every assumption is visible and adjustable.

> The cost figures here are **illustrative estimates**, not legal or financial advice. Replace them with your organization's own numbers (see [`config.example.json`](./config.example.json)) before relying on the output.

## What it models

- Recurring compliance cost: subject-access requests, data-mapping across systems, DPO and analyst time.
- Breach-risk exposure and EU AI Act conformity/monitoring cost for AI systems.
- Where a connected data layer reduces that exposure.

## Install & use

```bash
npm install
npm run typecheck && npm test
```

```ts
import { calculateComplianceResults, DEFAULT_COMPLIANCE_INPUTS } from "@langoptima/gdpr-ai-act-compliance-calculator";

const result = calculateComplianceResults(DEFAULT_COMPLIANCE_INPUTS);
```

Framework-agnostic TypeScript, zero runtime dependencies.

## Built by LangOptima

LangOptima builds AI-ready data and knowledge-graph systems for enterprises. This is one of our open-source [free tools](https://tools.langoptima.com) — [langoptima.com](https://www.langoptima.com).

## License

[Apache-2.0](./LICENSE). Free to use, modify, and redistribute. The **LangOptima name and marks are not licensed** — a fork may not imply endorsement (see [`NOTICE`](./NOTICE)). Contributions: [`CONTRIBUTING.md`](./CONTRIBUTING.md) · Support: [`SUPPORT.md`](./SUPPORT.md).
