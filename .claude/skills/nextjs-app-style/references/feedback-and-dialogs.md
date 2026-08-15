# Feedback and Dialogs

## Every mutation reports success and failure

Check what feedback channel the project already uses before adding one:

- **If a toast system exists** (e.g. Sonner), report both outcomes through it, mounted once at the app-shell level (root layout), not per page or per form.
- **If the project drives feedback off mutation state instead** (e.g. React Query's `isPending`/`isError`/`isSuccess`, with no toast library present), render an inline status tied to that state — don't introduce a toast library as a side effect of an unrelated change.

```tsx
export function CreateOrderForm() {
  const createOrder = useCreateOrder();
  const form = useForm<CreateOrderValues>({ resolver: zodResolver(createOrderSchema) });

  const handleSubmit = (values: CreateOrderValues) => {
    createOrder.mutate(values, { onSuccess: () => form.reset() });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {createOrder.isError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t create the order. Please try again.
          </p>
        )}
        {/* fields */}
        <Button type="submit" disabled={createOrder.isPending}>
          Create order
        </Button>
      </form>
    </Form>
  );
}
```

Do not leave a mutating call with no failure feedback "because it's a small form" — an add-item mini-form has the same failure-feedback obligation as a full page form. A mutation whose `isError` state is never read anywhere in the component is a defect worth flagging in review, even when the happy path works and is tested.

## No browser-native dialogs

Replace `window.confirm()`, `window.alert()`, and `window.prompt()` with the app's own dialog primitive (e.g. shadcn's `Dialog`/`AlertDialog`) once one exists in the project. Keep the trigger and copy equivalent to what the native dialog said:

```tsx
<Dialog open={Boolean(role)} onOpenChange={(open) => !open && onClose()}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete this role?</DialogTitle>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="destructive" onClick={handleConfirm}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Preserve the existing confirm/cancel state machine (e.g. `idle`/`deleting`/error, or a mutation's own `isPending`/`isError`) when migrating off `window.confirm()` — this is a UI-channel change, not a behavior change.

When a delete can be rejected for a business reason the user needs to act on (e.g. "this role is still assigned to N users"), let the same modal step forward into a second state — showing the reason and a follow-up action (a force-delete confirm) — rather than closing and requiring the user to retry from scratch. See [data-layer.md](data-layer.md)'s guidance on typed error classes for how the mutation surfaces that reason to the modal.

## Feedback content

- Whichever channel is used (toast or inline), success/failure copy is short and specific ("Order created.", "Couldn't delete order.") — not a generic "Something went wrong."
- Field-level errors belong inline via the form primitives. Submit-level (whole-action) outcomes are a separate, single piece of state — don't duplicate the same message as both a field error and a submit-level one.
