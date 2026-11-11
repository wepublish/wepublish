#!/usr/bin/env bash
set -uo pipefail

DOCS_ONLY='^(docs|agent|\.agents|\.ai|\.claude)/|\.md$|^(\.clinerules|\.cursorrules|\.windsurfrules|skills-lock\.json|LICENSE|CODEOWNERS)$'
output="${GITHUB_OUTPUT:-/dev/stdout}"

result() {
  echo "code=$1" >>"$output"
  echo "Code changed: $1 ($2)" >&2
  exit 0
}

if [[ -z "${PR_NUMBER:-}" ]]; then
  result true "not a pull request"
fi

if ! files="$(gh api --paginate "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/files" --jq '.[].filename')"; then
  echo "::warning::Could not list the pull request's files, running everything." >&2
  result true "file list unavailable"
fi

listed="$(grep -c . <<<"$files" || true)"
if [[ "$listed" -lt "${CHANGED_FILES:-0}" ]]; then
  result true "the API listed $listed of ${CHANGED_FILES} files"
fi

code_files="$(grep -vE "$DOCS_ONLY" <<<"$files" | grep -c . || true)"
if [[ "$code_files" -eq 0 ]]; then
  result false "all $listed files are docs or AI tooling"
fi
result true "$code_files of $listed files are outside docs and AI tooling"
