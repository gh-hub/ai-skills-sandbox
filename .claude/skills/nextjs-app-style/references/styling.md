# Styling

## Utility classes, not inline styles

Once a utility CSS framework (e.g. Tailwind) is in the project, style through class names. Do not add `style={}` objects or new standalone CSS files for anything expressible as utility classes.

## Merging conditional classes

Use the project's class-merging helper (typically a `cn()` wrapping `clsx` + `tailwind-merge`) for conditional or composed class names, instead of manual string concatenation or template literals:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
<Button className={cn("w-full", isDestructive && "text-destructive")}>
```

## Data-driven visual mappings

When a component maps domain data to a visual property that the utility framework can't express at build time (e.g. a color chosen per category name, per status, or per user), keep that mapping as a small typed lookup module (`category-colors.ts`) — not scattered literals inside the component, and not solved by switching back to inline `style={}`. This lookup is a data/business concern; treat it the same as any other domain module in the lib layer, not as styling infrastructure to redesign casually.

## Generated UI primitives stay generated

Don't hand-edit generated shadcn (or equivalent) primitive files to add one-off project styling. Extend or wrap the primitive from a feature component instead, so a future regeneration of the primitive doesn't silently discard the customization.
