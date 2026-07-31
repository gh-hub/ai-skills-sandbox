"use client";

import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { useLogout, useMe } from "@/lib/api-client/auth";

export function HeaderAuthControl() {
  const me = useMe();
  const logout = useLogout();

  if (me.isLoading || me.data === undefined) {
    return null;
  }

  if (me.data === null) {
    return <AuthModal />;
  }

  return (
    <div className="flex items-center gap-2">
      <UserAvatar name={me.data.name} size="sm" />
      <Button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        variant="ghost"
        size="sm"
      >
        Log out
      </Button>
    </div>
  );
}
