# Component Structure

## Check which layout the project already uses

Some projects keep every component flat in a single `components/` directory; others group by feature/domain with a barrel per folder. Both are valid — match whichever the project has. The rest of this file describes the feature-folder convention for projects that already use it; if the project is flat, keep new components flat too and don't introduce folders/barrels as a side effect of an unrelated change. Revisit the flat structure with the user once the directory is large enough that a reorg is worth its own change — don't do it opportunistically inside an unrelated ticket.

## Feature-based folders (when the project already uses them)

Group components by feature/domain, not by type (no top-level `forms/`, `buttons/`, `lists/` split across unrelated features).

```text
app/components/
  orders/
    OrderList.tsx
    OrderList.test.tsx
    CreateOrderForm.tsx
    CreateOrderForm.test.tsx
    index.ts
  order-actions/
    DeleteOrderButton.tsx
    DeleteOrderButton.test.tsx
    index.ts
  ui/
    button.tsx
    input.tsx
    form.tsx
    alert-dialog.tsx
  index.ts
```

Each feature folder has a barrel `index.ts` re-exporting its components:

```ts
// app/components/orders/index.ts
export { OrderList } from "./OrderList";
export { CreateOrderForm } from "./CreateOrderForm";
```

The root `app/components/index.ts` re-exports every feature folder, but **not** `ui/`:

```ts
// app/components/index.ts
export * from "./orders";
export * from "./order-actions";
```

`ui/` holds only generated/vendor primitives (e.g. shadcn output). Import those directly from their own path (`@components/ui/button`), never through the root barrel — the root barrel is for feature components, not primitives.

## Adding a new component

In a feature-foldered project:

1. Determine which existing feature folder it belongs to, or create a new one if it represents a new feature/domain.
2. Add the component and its colocated test to that folder.
3. Export it from the folder's `index.ts`.
4. Confirm the folder is re-exported from the root barrel (add it if the folder is new).

Never add a new component directly at the top level of the components directory once feature folders are established — that recreates the flat-file problem the folder structure exists to solve.

In a flat project, just add the component (and its colocated test) directly under `components/`, matching existing naming.

## Path aliases

Check `tsconfig.json`'s `compilerOptions.paths` for the aliases the project already uses before introducing new ones. A typical setup:

```json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["./app/components/*"],
      "@lib/*": ["./app/lib/*"]
    }
  }
}
```

Import via the alias (`@components/orders`, `@lib/orders-api`), not relative paths (`../../components/orders`) — this is the entire point of adding the alias. If a project already uses a different convention (e.g. a single `@/*` root alias), follow that instead of introducing a second aliasing scheme.

## Naming

- Component files: `PascalCase.tsx`, matching the exported component name.
- Generated UI primitives (`ui/`): keep whatever casing the generator produces (shadcn uses kebab-case, e.g. `alert-dialog.tsx`) — don't rename these to match component-file casing.
- Lib/data files: `kebab-case.ts`, named by responsibility (`orders-api.ts`, `order.ts`), not `utils.ts`/`helpers.ts`.
- Use named exports for components and utilities.
