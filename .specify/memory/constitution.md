<!--
Sync Impact Report
- Version change: (unset/template) → 1.0.0
- Modified principles: all placeholders → five concrete principles (initial ratification)
  - [PRINCIPLE_1_NAME] → I. Docker Compose First
  - [PRINCIPLE_2_NAME] → II. Spec/Plan/Tasks Coevolution
  - [PRINCIPLE_3_NAME] → III. No Corporate Auth in v1
  - [PRINCIPLE_4_NAME] → IV. Stack Simplicity
  - [PRINCIPLE_5_NAME] → V. Mandatory Queue Audit Logs
- Added sections: Project Scope; Development Workflow; Governance (filled)
- Removed sections: none (template structure preserved)
- Follow-up TODOs: none
-->

# Fila Emergência Castelão Constitution

## Core Principles

### I. Docker Compose First
Local development and demonstration MUST run exclusively through Docker Compose.
`docker compose up` (with the project `.env`) is the only supported way to start
the stack. Ad-hoc host installs of Node, nginx, or Postgres for day-to-day work
are forbidden unless temporarily justified and documented in the feature plan.
Rationale: one command reproduces totem, painel, API, and database for demos
and CI-aligned local checks.

### II. Spec/Plan/Tasks Coevolution
Feature work MUST keep `spec.md`, `plan.md`, and `tasks.md` aligned. Any pull
request that modifies `spec.md` MUST also update `plan.md` and `tasks.md` in the
same change set. Continuous Integration MUST fail the PR when this coevolution
rule is violated. Rationale: Spec-Driven Development only works if design
artifacts stay executable and reviewable together.

### III. No Corporate Auth in v1
Version 1 MUST NOT require corporate SSO, VPN gateways, or organization-wide
identity providers. Public totem and team panel operate without login for the
simulation. Introducing authentication is out of scope for v1 and REQUIRES a
constitutional amendment plus a new feature spec before implementation.
Rationale: the product is a local emergency-queue simulation, not a production
enterprise system.

### IV. Stack Simplicity
The approved stack is vanilla HTML/CSS/JS served by nginx, Node.js with Express
for the API, and PostgreSQL for persistence. New frameworks, ORMs, SPA
toolchains, or extra runtime services MUST NOT be added unless a constitution
amendment and plan explicitly approve them. Prefer the smallest change that
satisfies the spec. Rationale: keep the simulation easy to read, run, and
demo under time pressure.

### V. Mandatory Queue Audit Logs
Every queue-mutating action (enqueue, call, skip, complete, cancel, or
equivalent) MUST write an audit log record with who/what/when (actor surface,
action type, ticket/queue identity, timestamp). Audit failures MUST NOT be
silent: persistence of the business action and its audit entry MUST succeed
together or fail together. Rationale: demo trust and post-hoc debugging depend
on a complete action history.

## Project Scope

This constitution governs the Fila Emergência Castelão simulation: a public
totem for patients and a team panel for staff, backed by an Express API and
Postgres, delivered as a Docker Compose stack. Production hospital integration,
corporate identity, and multi-tenant SaaS concerns are out of scope for v1.

## Development Workflow

1. Describe or revise behavior in Spec Kit artifacts (`spec.md` → `plan.md` →
   `tasks.md`) before or alongside implementation.
2. Implement only what the current feature tasks require; do not expand the
   stack without governance approval.
3. Validate locally with Docker Compose; use project quickstart docs for
   end-to-end checks.
4. Open PRs that keep spec/plan/tasks coevolved; CI Spec Validation is a
   required gate when `spec.md` changes.
5. Reviewers MUST reject changes that violate Core Principles or leave queue
   actions without audit logging.

## Governance

This constitution supersedes conflicting informal practices for this repository.
Amendments MUST:

1. Update `.specify/memory/constitution.md` with a Sync Impact Report comment.
2. Bump `CONSTITUTION_VERSION` using semantic versioning:
   - MAJOR: remove or redefine a non-negotiable principle incompatibly.
   - MINOR: add a principle/section or materially expand guidance.
   - PATCH: clarify wording without changing intent.
3. Set **Last Amended** to the amendment date (ISO `YYYY-MM-DD`).
4. Note migration impact on existing specs, plans, tasks, and CI rules.

Compliance review: every PR and Spec Kit workflow run MUST be checked against
these principles. Unjustified complexity or stack expansion MUST be rejected.
Runtime agent guidance continues to read this file; dependent templates are not
edited by constitution amendments alone.

**Version**: 1.0.0 | **Ratified**: 2026-08-08 | **Last Amended**: 2026-08-08
