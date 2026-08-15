# Testing

## Colocate tests with components

Each component/page gets a colocated `.test.tsx` in the same folder, not a separate mirrored test tree. When a component moves (e.g. during a folder reorg), its test moves with it in the same change.

## Mock at the data-layer boundary

If the project's data layer goes through a typed `apiClient` (see [data-layer.md](data-layer.md)), mock that module (`jest.mock("@/lib/api-client/client")`) rather than `global.fetch` — it's the actual seam components depend on, and it keeps tests from needing to know about request/response shapes the typed client already encodes. Components under test that call `useQuery`/`useMutation` hooks also need a `QueryClientProvider` wrapper in the test render.

Only mock `global.fetch` directly if the project has no typed client yet and calls `fetch` straight from lib functions:

```ts
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function mockFetch(result: { ok: boolean; body?: unknown }) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: result.ok, json: async () => result.body ?? {} } as Response),
  ) as unknown as typeof fetch;
}
```

## Query by accessible role/label, not test IDs

Prefer `getByRole`, `getByLabelText`, `getByText` over `data-testid` hooks — this exercises the same accessible structure a real user relies on and breaks when markup actually becomes inaccessible, not just when it's reshuffled.

## Async assertions

Form submission, validation, and toast rendering are asynchronous with RHF + zod. Wrap post-submit assertions in `waitFor`/`findBy*`:

```ts
fireEvent.click(screen.getByRole("button", { name: /create order/i }));

await waitFor(() => {
  expect(screen.getByText("Order created.")).toBeInTheDocument();
});
```

## What changes when migrating markup, what doesn't

When a component's underlying primitive changes (e.g. a native `<select>` becomes a combobox-style component), update the interaction pattern in its test (open, then click an option, instead of `fireEvent.change`) — but keep asserting the same business behavior (which option ends up selected, what payload gets sent). Don't drop coverage of the underlying behavior just because the interaction mechanics changed.

## Full suite as the done-gate

Treat a full test-suite run (not just the touched component's tests) as part of "done" for any change that touches a shared component, a folder move, or an import-path change — those are exactly the kinds of changes that break tests elsewhere without touching the files those tests belong to.
