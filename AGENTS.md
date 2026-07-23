# Agent collaboration guide

This repository is maintained with both Claude and Codex. Treat repository files and GitHub history as the shared source of truth; do not rely on private chat context.

## Start here

- Read `README.md`, `docs/development.md`, and `docs/code-review.md`.
- Read `CLAUDE.md` only for the cross-agent handoff convention; do not duplicate rules between the two files.
- Check `git status`, the current branch, and recent commits before editing.
- Preserve user changes and unrelated work.

## Required verification

- Install dependencies with `npm ci` when `node_modules` is missing or the lockfile changed.
- Run `npm run verify:data`.
- Run `npm run build`.
- For UI changes, verify the affected flow in a browser at desktop and mobile widths.
- Record commands run and any unverified behavior in the commit, PR, or GitHub issue.

## Project invariants

- `src/App.jsx` is the main application and data-model source.
- When changing template IDs or the persisted project shape, update migrations and regression tests together.
- Keep `SCHEMA_VERSION`, `normalizeImported`, and `scripts/verify-project-data.mjs` aligned.
- Never add real client documents, local paths, original proposal names, secrets, or identifiable source material.
- Built-in examples must remain clearly labeled as fictional learning examples.
- Do not deploy, publish, or change repository visibility unless the user explicitly requests it.

## Handoff

- Make small, intentional commits with the reason and verification result.
- Leave unfinished or cross-agent work in a GitHub issue with a concrete checklist.
- Prefix a handoff issue title with `[Claude]`, `[Codex]`, or `[Agent handoff]` when ownership matters.
