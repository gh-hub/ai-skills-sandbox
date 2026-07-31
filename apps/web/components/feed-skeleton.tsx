export function FeedSkeleton() {
  return (
    <ul className="flex flex-col gap-4" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <li
          key={key}
          className="h-24 animate-pulse rounded-lg border border-border bg-card"
        />
      ))}
    </ul>
  );
}
