import { AuthModal } from "@/components/auth-modal";

export function LoginPrompt() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Log in to create an award.
      </p>
      <AuthModal />
    </div>
  );
}
