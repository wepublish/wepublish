#!/usr/bin/env bash
set -euo pipefail

CODECOV_CLI_VERSION="11.3.1"
PARALLEL_UPLOADS="${PARALLEL_UPLOADS:-4}"
CODECOV="${CODECOV_CLI:-codecovcli}"

reports=()
while IFS= read -r report; do
  reports+=("$report")
done < <(find coverage -path '*/report/lcov.info' -type f 2>/dev/null | sort)

ignores=()
while IFS= read -r pattern; do
  ignores+=("$pattern")
done < <(awk '
  /^[^[:space:]#]/ { in_ignore = ($0 ~ /^ignore:/); next }
  in_ignore && /^[[:space:]]*-/ { sub(/^[[:space:]]*-[[:space:]]*/, ""); gsub(/["\047]/, ""); print }
' .codecov.yml)

is_ignored() {
  local file="$1" pattern
  for pattern in ${ignores[@]+"${ignores[@]}"}; do
    # shellcheck disable=SC2053
    if [[ "$file" == $pattern || "$file" == $pattern/* ]]; then
      return 0
    fi
  done
  return 1
}

has_reportable_lines() {
  local file
  while IFS= read -r file; do
    if ! is_ignored "$file"; then
      return 0
    fi
  done < <(awk '/^SF:/ { file = substr($0, 4) } /^DA:/ && file != "" { print file; file = "" }' "$1")
  return 1
}

reportable=()
for report in ${reports[@]+"${reports[@]}"}; do
  if has_reportable_lines "$report"; then
    reportable+=("$report")
  else
    echo "Skipping $report: no lines outside the .codecov.yml ignore list."
  fi
done
reports=("${reportable[@]+"${reportable[@]}"}")

if [[ ${#reports[@]} -eq 0 ]]; then
  echo "No coverage reports found, nothing to upload."
  exit 0
fi

if ! command -v "$CODECOV" >/dev/null; then
  pipx install --quiet "codecov-cli==${CODECOV_CLI_VERSION}"
fi

graph="$(mktemp -d)/graph.json"
pnpm exec nx graph --file="$graph" >/dev/null
roots="$(jq -r '.graph.nodes | to_entries[] | "\(.value.data.root)\t\(.key)"' "$graph")"

uploads="$(mktemp)"
for report in ${reports[@]+"${reports[@]}"}; do
  root="${report#coverage/}"
  root="${root%/report/lcov.info}"
  flag="$(awk -F'\t' -v root="$root" '$1 == root { print $2 }' <<<"$roots")"
  if [[ -z "$flag" && -f "$root/project.json" ]]; then
    flag="$(jq -r '.name // empty' "$root/project.json")"
  fi
  if [[ -z "$flag" ]]; then
    echo "::error::No Nx project has root '$root' (from $report)"
    exit 1
  fi
  if [[ ! "$flag" =~ ^[A-Za-z0-9_.-]{1,45}$ ]]; then
    echo "::error::'$flag' is not a valid Codecov flag name"
    exit 1
  fi
  printf '%s\t%s\n' "$flag" "$report" >>"$uploads"
done

if [[ -z "${CODECOV_TOKEN:-}" && -n "${FORK_BRANCH:-}" ]]; then
  export TOKENLESS="$FORK_BRANCH"
fi

auth=(--git-service github --fail-on-error)
if [[ -n "${CODECOV_TOKEN:-}" ]]; then
  auth+=(--token "$CODECOV_TOKEN")
fi

"$CODECOV" create-commit "${auth[@]}"
"$CODECOV" create-report "${auth[@]}"

echo "Uploading ${#reports[@]} coverage reports, one flag per Nx project."
export CODECOV
export AUTH="${auth[*]}"
xargs -P "$PARALLEL_UPLOADS" -L 1 bash -c '
  flag="$0"
  report="$1"
  read -r -a auth <<<"$AUTH"
  "$CODECOV" do-upload "${auth[@]}" --disable-search --flag "$flag" --name "$flag" --file "$report" >/dev/null \
    && echo "  $flag" \
    || { echo "::error::Upload failed for $flag ($report)"; exit 255; }
' <"$uploads"
