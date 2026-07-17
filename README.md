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

## Work with LangOptima

1. **Run the live tool** → [tools.langoptima.com/compliance-calculator](https://tools.langoptima.com/compliance-calculator).
2. **Talk it through** → book a compliance scoping call at [calendly.com/langoptima](https://calendly.com/langoptima). Compliance in regulated AI is the frontier a knowledge layer is built for — [see how](https://www.langoptima.com/service/ontology).

## License

[Apache-2.0](./LICENSE). Free to use, modify, and redistribute. The **LangOptima name and marks are not licensed** — a fork may not imply endorsement (see [`NOTICE`](./NOTICE)). Contributions: [`CONTRIBUTING.md`](./CONTRIBUTING.md) · Support: [`SUPPORT.md`](./SUPPORT.md).
