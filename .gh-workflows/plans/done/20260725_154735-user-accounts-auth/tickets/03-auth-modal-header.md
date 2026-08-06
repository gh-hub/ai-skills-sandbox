# 03 — Web: login/signup modal + header auth state

**What to build:** a reusable Dialog primitive built on radix-ui's dialog
primitive (no modal component exists in this codebase yet), styled
consistently with the existing button/input/form components. One modal
holds both the login and signup forms behind a toggle — not two separate
flows — built with the same form pattern already used for the story-share
form, surfacing validation errors (e.g. password too short) and server
errors (e.g. duplicate email on signup, invalid credentials on login) inline,
matching the page's existing error-display style. A shared initials-avatar
component (derived from a user's name) is introduced here for the header and
will be reused by the story feed in ticket 04. The hero card's header row
shows a "Login" button that opens the modal when there's no current session,
and the initials avatar plus a plain "Log out" button when there is one —
driven by a "me" query called on load, so a page reload preserves login
state without the frontend ever touching the session token. On successful
login/signup, the modal closes and the header updates immediately; "Log out"
clears the session and the header reverts to "Login."

**Blocked by:** 01 — Users + auth API foundation

**Status:** ready

- [x] A reusable Dialog primitive exists in the web app's shared UI components
- [x] One modal toggles between login and signup forms; signup collects name/email/password, login collects email/password
- [x] Validation errors (e.g. short password) and server errors (e.g. duplicate email, bad credentials) are shown inline in the modal
- [x] A shared initials-avatar component exists, usable by both the header and (in ticket 04) the story feed
- [x] Header shows "Login" when logged out; shows initials avatar + "Log out" when logged in
- [x] Header state is driven by the "me" endpoint and survives a page reload
- [x] Successful login/signup closes the modal and updates the header immediately; logout updates the header back to "Login"
