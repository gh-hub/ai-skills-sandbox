# Review Checklist

Use this checklist after generating or refactoring Next.js frontend code.

## Component structure

- Does the new component match the project's existing layout — feature folder (with barrel) if the project already uses feature folders, flat if the project is flat?
- If feature-foldered: does the folder have a barrel `index.ts`, and is that folder re-exported from the root barrel?
- Does the root barrel (if one exists) stay clear of `ui/` primitives?
- Are imports using the project's existing path aliases instead of relative paths?
- Are named exports used consistently?

## Forms

- Does every form (including low-validation ones like filters) go through the project's form + schema library?
- Are all fields — including custom/non-native ones — wired through the form library's field API, not partially bypassed?
- Do field-level errors render inline, and submit-level outcomes render as toasts (not the reverse)?
- Does a business-rule-specific rejection message reach the user verbatim when the server provides one?

## Feedback and dialogs

- Does every mutating call report both a success and a failure path, through whichever channel the project uses (toast or inline mutation-state)?
- Is any `window.confirm`/`alert`/`prompt` still present where an in-app dialog system already exists?
- If using toasts: is the renderer mounted once at the app-shell level?
- If using React Query: is `isError`/`isPending` actually read and rendered somewhere, not just left unused on the mutation object?

## Data layer

- Do components call typed hooks/lib functions instead of calling `apiClient`/`fetch` directly?
- If using React Query: does each domain module export query-key constants, and does every mutation invalidate every query key it could have affected (not just its own domain)?
- Does each API call throw or otherwise surface a non-ok response rather than silently returning bad data?
- Do business-rule-specific rejections (ones the UI branches on) use a typed error class instead of being re-parsed ad hoc at the call site?
- If not using React Query: is async load state modeled as a small union type rather than multiple booleans, and do `useEffect` fetches guard against post-unmount state updates?
- Are optimistic updates limited to easily-reversible actions, with a revert-on-failure path?

## Styling

- Are inline `style={}` objects absent where utility classes could express the same thing?
- Is the project's `cn()`-style helper used for conditional/merged class names?
- Are data-driven visual mappings kept in a typed lookup module rather than scattered literals?
- Are generated UI primitives left unedited, with customization done via wrapping instead?

## Scope and quality

- Are changes limited to the requested behavior and necessary cleanup?
- Were current project naming, folder, and stack conventions preserved?
- Was the installed framework version checked before relying on an App Router API from memory?
- Are colocated tests added or updated for changed behavior?
- Does the full test suite pass, not just tests for directly touched files?
