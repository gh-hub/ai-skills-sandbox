# Requirements: user-accounts-auth

## Problem

"Thanks, Claude" today is fully anonymous: anyone can click Like and optionally
leave a short story, but there's no notion of who left it. There's no way for a
visitor to have an identity on the site, and no way to tell, on the public
story feed, whether two stories came from the same person or to put a name to
one.

## Solution

Add basic accounts: a visitor can sign up (name, email, password) and log in,
via a single modal reachable from the top-right of the existing hero card.
Once logged in, their likes and stories are tied to their account instead of
being anonymous, and the public story feed shows who left an attributed story
(an initials avatar + their name) versus an anonymous one (an anonymous icon).
Anonymous liking/story-sharing keeps working exactly as it does today for
anyone who doesn't want to log in.

## Done looks like

- A visitor can open a "Log in" modal from the top-right of the hero card and
  switch to "Create account" inside the same modal.
- A visitor can create an account with a name, email, and password (min 6
  characters) and is logged in immediately after.
- A visitor with an existing account can log in with email + password.
- After logging in, the top-right hero spot shows an initials avatar (derived
  from the account's name) plus a plain "Log out" button, replacing the
  "Login" button.
- Clicking "Log out" ends the session and the "Login" button reappears.
- A page reload keeps a logged-in visitor logged in (session survives reload).
- When a logged-in visitor clicks Like / submits a story, the resulting row is
  attributed to their account.
- When a visitor who is not logged in clicks Like / submits a story, it is
  recorded anonymously, exactly as it works today.
- Logged-in visitors can still like/share as many times as they want — no
  one-per-user limit is introduced.
- The public story feed shows, per story: an initials avatar + full name for
  attributed stories, or an anonymous icon for anonymous ones.

## Out of scope (explicitly confirmed)

- No password reset flow.
- No email verification.
- No rate limiting or lockout on login attempts.
- No OAuth / social login.
- No profile editing (no way to change name/email/password after signup).
