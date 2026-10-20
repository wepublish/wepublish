#!/usr/bin/env bash
set -euo pipefail

usage='Usage: nx-scoped.sh <nx show projects filters...> [-- <nx run-many args...>]'

select_args=()
while [[ $# -gt 0 && "$1" != "--" ]]; do
  select_args+=("$1")
  shift
done
[[ $# -gt 0 ]] && shift
run_args=("$@")

if [[ ${#select_args[@]} -eq 0 ]]; then
  echo "$usage" >&2
  exit 2
fi

mode="${NX_SCOPE:-full}"
shard_index="${SHARD_INDEX:-1}"
shard_total="${SHARD_TOTAL:-1}"
summary="${GITHUB_STEP_SUMMARY:-/dev/null}"
nx=(pnpm exec nx)

case "$mode" in
  full | shadow | affected) ;;
  *)
    echo "::error::NX_SCOPE must be full, shadow or affected, got '$mode'" >&2
    exit 2
    ;;
esac

work="$(mktemp -d)"
"${nx[@]}" graph --file="$work/graph.json" >/dev/null
root_project="$(jq -r '.graph.nodes | to_entries[] | select(.value.data.root == ".") | .key' "$work/graph.json")"

projects() {
  "${nx[@]}" show projects "$@" --json | jq -r '.[]' | sort
}

resolve_affected() {
  local base="${NX_BASE:-}" head="${NX_HEAD:-HEAD}"

  if [[ -z "$base" ]] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
    echo "::warning::Base '${base}' does not resolve to a commit, running the full set." >&2
    return 1
  fi
  if ! git cat-file -e "${head}^{commit}" 2>/dev/null; then
    echo "::warning::Head '${head}' does not resolve to a commit, running the full set." >&2
    return 1
  fi

  local any_project changed_files
  any_project="$(projects --affected --base="$base" --head="$head" | grep -vxF "$root_project" | wc -l)"
  changed_files="$(git diff --name-only "$base" "$head" | grep -vE '\.md$' | wc -l)"
  if [[ "$any_project" -eq 0 && "$changed_files" -gt 0 ]]; then
    echo "::warning::$((changed_files)) changed files but no Nx project is affected, running the full set." >&2
    return 1
  fi

  projects --affected --base="$base" --head="$head" "${select_args[@]}"
}

projects "${select_args[@]}" >"$work/all"

: >"$work/affected"
scope_ok=true
if [[ "$mode" != "full" ]]; then
  if resolve_affected >"$work/affected"; then
    scope_ok=true
  else
    scope_ok=false
    cp "$work/all" "$work/affected"
  fi
fi

if [[ "$mode" == "affected" ]]; then
  cp "$work/affected" "$work/selected"
else
  cp "$work/all" "$work/selected"
fi

jq -r '.graph.nodes | to_entries[] | "\(.key)\t\(.value.data.root)"' "$work/graph.json" >"$work/roots"
while IFS= read -r project; do
  [[ -z "$project" ]] && continue
  root="$(awk -F'\t' -v p="$project" '$1 == p { print $2 }' "$work/roots")"
  weight="$(git ls-files -- "$root" | grep -cE '\.(spec|test)\.[cm]?[jt]sx?$' || true)"
  printf '%s\t%s\n' "$((weight + 1))" "$project"
done <"$work/selected" | sort -t$'\t' -k1,1nr -k2,2 | awk -F'\t' -v total="$shard_total" -v want="$shard_index" '
  BEGIN { for (i = 1; i <= total; i++) load[i] = 0 }
  {
    best = 1
    for (i = 2; i <= total; i++) if (load[i] < load[best]) best = i
    load[best] += $1
    if (best == want) print $2
  }
' | sort >"$work/shard"

all_count="$(grep -c . "$work/all" || true)"
affected_count="$(grep -c . "$work/affected" || true)"
shard_count="$(grep -c . "$work/shard" || true)"

{
  echo "### Nx scope: \`$mode\` (${select_args[*]})"
  echo
  echo "| | Projects |"
  echo "| --- | --- |"
  echo "| Full set | $all_count |"
  if [[ "$mode" != "full" ]]; then
    echo "| Affected | $affected_count$([[ "$scope_ok" == false ]] && echo ' (fell back to the full set)') |"
  fi
  echo "| This shard ($shard_index/$shard_total) | $shard_count |"
} >>"$summary"
echo "Scope $mode, shard $shard_index/$shard_total: $shard_count of $all_count projects (affected: $affected_count)." >&2

if [[ "$shard_count" -eq 0 ]]; then
  echo "Nothing to run in this shard."
  exit 0
fi

status=0
"${nx[@]}" run-many --projects="$(paste -sd, "$work/shard")" --outputStyle=static "${run_args[@]}" 2>&1 | tee "$work/run.log" || status=$?

if [[ "$mode" == "shadow" && "$status" -ne 0 ]]; then
  sed -E $'s/\e\\[[0-9;]*m//g' "$work/run.log" | awk '
    /^[[:space:]]*Failed tasks:/ { inside = 1; next }
    inside && /^[[:space:]]*$/ { next }
    inside && /^[[:space:]]*- [^[:space:]:]+:/ { sub(/^[[:space:]]*- /, ""); sub(/:.*/, ""); print; next }
    inside { inside = 0 }
  ' | sort -u >"$work/failed" || true
  missed="$(comm -23 "$work/failed" "$work/affected" | paste -sd' ' -)"
  if [[ ! -s "$work/failed" ]]; then
    echo "::warning::Shadow check could not read the failed projects from the Nx output."
  elif [[ -n "$missed" ]]; then
    echo "::warning::Affected scoping would have skipped failing projects: $missed"
    printf '\n**Affected scoping would have skipped failing projects:** %s\n' "$missed" >>"$summary"
  else
    echo "Shadow check: every failing project was in the affected set."
  fi
fi

exit "$status"
