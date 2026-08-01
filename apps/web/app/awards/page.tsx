import Link from "next/link";
import { AwardsList } from "@/components/awards-list";
import { CreateAwardSection } from "@/components/create-award-section";

export default function AwardsPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <Link
          href="/"
          className="self-start text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Awards</h1>
        <p className="text-muted-foreground">
          Badges the community gives out alongside their thanks.
        </p>
      </div>

      <section aria-label="Awards list" className="flex flex-col gap-4">
        <AwardsList />
      </section>

      <CreateAwardSection />
    </main>
  );
}
