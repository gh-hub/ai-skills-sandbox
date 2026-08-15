---
name: nextjs-app-style
description: enforce an opinionated next.js app-router and typescript frontend style when generating, reviewing, or refactoring components, forms, and data-fetching code. use for next.js implementation work, pull request reviews, component folder organization, form/validation architecture, api-client conventions, and shadcn/ui + tailwind styling.
---

# Next.js App Style

Apply these rules when generating, reviewing, or refactoring Next.js (App Router) frontend code.

## Core workflow

1. Inspect the existing app directory layout, component folder structure, path aliases, styling system, form library, and data-fetching pattern before changing code.
2. Preserve established project conventions unless they conflict with a rule in this skill.
3. If the project hasn't adopted a piece of this stack (shadcn/ui, React Hook Form + zod, Tailwind, React Query, toasts), adapt the underlying principle — organized components, schema-validated forms, a typed data layer, consistent submit feedback — to whatever the project already uses. Do not swap libraries or introduce a new structural convention (e.g. feature folders in a flat project) as a side effect of an unrelated change.
4. Check the installed framework version (`package.json`, and any project `AGENTS.md`/`CLAUDE.md` note about it) before relying on an App Router API from memory. Next.js has shipped breaking changes across major versions (server/client component rules, `params`/`searchParams` becoming async, etc.) that may not match training data.
5. Prefer focused changes. Do not restructure unrelated code without a clear maintainability benefit.
6. After making changes, run the checklist in [references/review-checklist.md](references/review-checklist.md).

## Non-negotiable rules

- If the project already groups components into feature-based folders with barrel `index.ts` files, follow that structure — never leave a new component flat at the top level once feature folders exist. If the project keeps a flat `components/` directory, match that instead; don't introduce feature folders as a side effect of an unrelated change.
- Keep generated/vendor UI primitives (e.g. shadcn) in their own `ui/` folder, consumed by feature components — never re-implement a primitive inline, and never fold `ui/` into the root barrel.
- Use named exports for components and utilities; avoid default exports (except where the framework requires one, e.g. `page.tsx`/`layout.tsx`).
- Every form is schema-validated (e.g. React Hook Form + zod) with inline field-level errors. Never rely on native `required`/manual `useState` validation alone once a validation library is in use anywhere else in the app.
- Every mutating action gives explicit submit-level success/failure feedback through whatever channel the project already uses (a toast, or React Query's `isPending`/`isError` state rendered inline). Never let a rejected mutation fail silently.
- Never use browser-native `confirm()`/`alert()`/`prompt()` once the project has an in-app dialog system — use the app's own dialog components instead.
- Keep data-fetching and typed domain models in a dedicated lib/data layer, separate from components. If the project uses React Query, that means one `useX` hook per read/mutation per domain module; components call those hooks, never `apiClient`/`fetch` directly.
- Style with the project's utility/class system (e.g. Tailwind); do not introduce inline `style={}` objects or ad hoc CSS once a utility system is established.

## Detailed guidance

- For folder layout, barrels, path aliases, and naming, read [references/component-structure.md](references/component-structure.md).
- For form architecture, schema conventions, and field wiring, read [references/forms.md](references/forms.md).
- For submit feedback (toasts or inline mutation-state) and confirmation dialogs, read [references/feedback-and-dialogs.md](references/feedback-and-dialogs.md).
- For the data/lib layer, React Query hook conventions, and typed API-client usage, read [references/data-layer.md](references/data-layer.md).
- For styling conventions, read [references/styling.md](references/styling.md).
- For test conventions, read [references/testing.md](references/testing.md).

## Review behavior

When reviewing existing code:

1. Identify concrete violations with file and component names.
2. Explain why each change improves consistency, testability, or maintainability.
3. Propose the smallest clear refactor.
4. Do not restructure trivial code merely to match a folder convention with no real benefit.
5. State explicitly when the current implementation is clearer and should remain unchanged.

## Generation behavior

When generating new code:

1. Follow the current folder structure (feature folders with barrels, or flat) and stack choices.
2. Create only the files needed for the requested behavior — including a new feature folder and barrel entry only if the project already organizes components that way.
3. Use explicit, responsibility-based names.
4. Wire every new form and mutating action through the project's validation and feedback conventions from the start, not as a follow-up.
5. Add or update colocated tests for changed behavior.
