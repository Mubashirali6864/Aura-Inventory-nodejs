---
name: ecc
description: >
  Everything Claude Code (ECC) engineering harness skill. MUST USE when the user
  asks about "ecc", "everything claude code", how to run ECC workflows, or wants
  to orchestrate multi-agent engineering (plan -> test -> implement -> review -> verify -> remember -> improve).
metadata:
  homepage: https://github.com/affaan-m/ECC
  origin: ECC
---

# Everything Claude Code (ECC)

ECC provides an agent harness operating system and coordinated engineering toolbox for AI coding assistants. Rather than executing unguided prompts, ECC enforces a disciplined engineering lifecycle:

```text
plan -> test -> implement -> review -> verify -> remember -> improve
```

## Core Workflows

1. **Planning & Spec**:
   - `/plan`: Create an implementation plan and wait for confirmation.
   - `/plan-prd`: Problem-first lean PRD generator.
   - `/dev-team`: Simulate a collaborative dev team session (PM, Architect, Dev, QA).

2. **Test-Driven Development (TDD)**:
   - `tdd-workflow`: Write failing unit, integration, or E2E tests first (80%+ coverage target).
   - Specialized builders: `/react-test`, `/go-test`, `/rust-test`, `/python-review`.

3. **Execution & Build Fixes**:
   - Specialized resolvers: `/build-fix`, `/react-build`, `/go-build`, `/rust-build`, `/flutter-build`.
   - Continuous Agent Loops: `/loop-start`, `/loop-status`.

4. **Multi-Agent Review & Verification**:
   - `/code-review`: Comprehensive review for local changes or pull requests.
   - `santa-method`: Adversarial dual-review convergence loop where two independent reviewers must pass.
   - `verification-loop`: Final verification before declaring any task complete.

5. **Memory, Learning & Instincts**:
   - `continuous-learning-v2`: Captures session lessons into instincts with confidence scoring.
   - `unified-memory`: Shared context across Claude, Codex, Hermes, and Antigravity harnesses.
   - `growth-log`: Structured logging of technical breakthroughs and patterns.

6. **Navigation & Diagnostics**:
   - `ecc-guide`: Live file-based navigation of all ECC skills, agents, commands, and rules.
   - `ecc-recipes`: Find the exact sequence of commands for complex workflows.
   - `configure-ecc`: Reconfigure scopes, hook profiles, and targets.
   - `ecc-tools-cost-audit`: Audit usage spikes, billing, and PR automation.

## Quick Commands & Tooling

Run via terminal using `npx ecc-universal`:
```bash
# Health check & diagnostics
npx ecc-universal doctor --target antigravity

# Inspect installed state
npx ecc-universal list-installed

# Discover profiles & components
npx ecc-universal catalog profiles

# Repair or auto-update
npx ecc-universal repair
npx ecc-universal auto-update
```
