// Mirrors the DATABASE_URL pattern in `../../db/client.ts`: read directly from
// process.env and hard-fail at startup if the secret is missing.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

export const JWT_SECRET = process.env.JWT_SECRET;
