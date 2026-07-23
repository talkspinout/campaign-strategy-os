# Code review standard

Review findings should prioritize behavior and user impact over style.

## Priority order

1. Data loss, broken migrations, unsafe imports, and persistence failures
2. Build, verification, deployment, or extension-loading regressions
3. Incorrect campaign logic, card state, brief output, or logic-review results
4. Privacy, source-material leakage, analytics, and unnecessary permissions
5. Accessibility, keyboard operation, responsive layout, and print output
6. Maintainability and documentation drift

## Evidence requirements

- Point to the smallest relevant file and line range.
- Explain the user-visible failure and a concrete reproduction path.
- Distinguish confirmed defects from risks that still require runtime verification.
- Do not report formatting preferences as defects.
- If no actionable defect is found, say so and identify remaining test coverage gaps.

## Completion checklist

- `npm run verify:data`
- `npm run build`
- Relevant desktop and mobile browser flow
- Import and export behavior when persistence changed
- Diff inspection for real names, local paths, secrets, and original source references
- Commit, PR, or issue contains a handoff summary for the next agent
