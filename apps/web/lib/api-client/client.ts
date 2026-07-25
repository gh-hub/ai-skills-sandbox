import createClient from "openapi-fetch";
import type { paths } from "./schema";

// `baseUrl` is always a relative path, so every request this client makes is
// inherently same-origin — nginx (see apps/web/nginx.conf) proxies /api/ to
// the API service under the same origin the static site is served from.
// `credentials: "same-origin"` makes that assumption explicit rather than
// relying on the browser fetch default, since the httpOnly session cookie
// set by /auth/signup and /auth/login must be sent back automatically for
// /auth/me, logout, and any attributed like/story submission to work.
export const apiClient = createClient<paths>({
  baseUrl: "/api",
  credentials: "same-origin",
});
