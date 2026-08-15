# Forms

## React Hook Form + zod on every form

Every form — including ones with little to validate, like a filter bar — uses the same architecture:

1. Define a zod schema describing the shape and constraints of the form data.
2. Use RHF's `useForm` with the zod resolver.
3. Register fields via the form library's field-registration/`FormField` API.
4. Render inline error messages via the form-primitive wrapper (e.g. shadcn's `Form`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage`).
5. Handle submission via `handleSubmit`, calling the mutation hook from the data layer, with submit-level feedback for success/failure through whatever channel the project uses (see [feedback-and-dialogs.md](feedback-and-dialogs.md)).

Applying this uniformly — even to a form whose schema ends up all-optional fields with no refinements — is a deliberate consistency choice, not overkill. If a form's schema is intentionally permissive, that's fine; don't skip the RHF+zod wrapper just because there's little to validate.

```ts
const createOrderSchema = z.object({
  customer: z.string().trim().min(1, "Customer is required"),
  quantity: z.coerce.number().int().positive(),
  notes: z.string(),
});

type CreateOrderFormValues = z.infer<typeof createOrderSchema>;
```

```tsx
export function CreateOrderForm({ onCreated }: { onCreated?: () => void }) {
  const createOrder = useCreateOrder();
  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { customer: "", quantity: 1, notes: "" },
  });

  function onSubmit(values: CreateOrderFormValues) {
    createOrder.mutate(values, {
      onSuccess: () => {
        form.reset();
        onCreated?.();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {createOrder.isError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t create the order. Please try again.
          </p>
        )}
        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createOrder.isPending}>
          Create order
        </Button>
      </form>
    </Form>
  );
}
```

This example assumes React Query for the mutation (see [data-layer.md](data-layer.md)). If the project instead uses plain async functions, wrap the call in try/catch and drive `form.formState.isSubmitting`/a local submit-error state the same way.

## Fields driven by non-native inputs

Custom controls (a tag picker, a checkbox group, a combobox) still go through `FormField`'s `field.value`/`field.onChange` — never bypass RHF for one field while the rest of the form is wired up (e.g. a tag-checkbox list mutating a prop directly while sibling fields go through `field.onChange`). A form is either fully RHF-driven or it isn't; a half-migrated field is a defect, not a shortcut.

## Live-apply forms (filters, search bars)

A form with no explicit submit action (e.g. filters that apply on every change) can still use RHF: wire each field's `onChange` to call the external `onChange`/apply callback directly, in addition to `field.onChange`, instead of forcing a `handleSubmit` that doesn't match the UX. Don't add a submit button just to satisfy the pattern if the form never had one.

## Errors that must show the server's exact message

Some rejections carry a business-rule-specific reason the user needs verbatim (e.g. "cannot complete: 2 checklist items unchecked"), not a generic "couldn't save" string. In that case, thread the server's message through to whichever feedback channel the project uses (a toast, or the inline `isError` message) instead of a hardcoded fallback — but only when the message is meant to be user-facing; don't surface raw exception text for unexpected/internal errors. See [data-layer.md](data-layer.md)'s typed-error-class guidance for rejections the UI needs to branch on, not just display.
