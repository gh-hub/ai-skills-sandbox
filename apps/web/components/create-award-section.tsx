"use client";

import { CreateAwardForm } from "@/components/create-award-form";
import { LoginPrompt } from "@/components/login-prompt";
import { useMe } from "@/lib/api-client/auth";

export function CreateAwardSection() {
  const me = useMe();

  if (me.isLoading || me.data === undefined) {
    return null;
  }

  if (me.data === null) {
    return <LoginPrompt />;
  }

  return <CreateAwardForm />;
}
