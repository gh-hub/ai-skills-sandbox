import type { AuthUser } from "@thanks-claude/shared-types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser | null;
    }
  }
}

export {};
