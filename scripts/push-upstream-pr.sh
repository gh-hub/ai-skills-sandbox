#!/usr/bin/env bash
# Push the current branch to the fork remote (origin) and open a PR
# against the main project (upstream). Requires the `gh` CLI to be
# authenticated, and `origin` + `upstream` remotes to be configured.
set -euo pipefail

repo_slug() {
  local url="$1"
  url="${url%.git}"
  if [[ "$url" == git@*:* ]]; then
    echo "${url#*:}"
  else
    echo "${url#*github.com/}"
  fi
}

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  echo "Refusing to open a PR from 'main'." >&2
  exit 1
fi

if ! git remote get-url upstream >/dev/null 2>&1; then
  echo "No 'upstream' remote configured (should point at the main project)." >&2
  exit 1
fi

UPSTREAM_SLUG=$(repo_slug "$(git remote get-url upstream)")
ORIGIN_OWNER=$(repo_slug "$(git remote get-url origin)")
ORIGIN_OWNER="${ORIGIN_OWNER%%/*}"

git push -u origin "$BRANCH"

gh pr create \
  --repo "$UPSTREAM_SLUG" \
  --base main \
  --head "${ORIGIN_OWNER}:${BRANCH}" \
  --fill \
  "$@"
