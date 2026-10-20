#!/usr/bin/env bash
set -uo pipefail

EXCLUDE=("api-example" "editor" "bka" "media")
failed=()

if [[ $# -gt 0 ]]; then
  apps=("$@")
else
  apps=()
  for dir in apps/*/; do
    apps+=("$(basename "$dir")")
  done
fi

for app in "${apps[@]}"; do
  if [[ ! -d "apps/$app" ]]; then
    echo "No such app: $app"
    failed+=("$app")
    continue
  fi

  skip=false
  for ex in "${EXCLUDE[@]}"; do
    if [[ "$app" == "$ex" ]]; then
      skip=true
      break
    fi
  done
  if [[ "$skip" == true ]]; then
    continue
  fi

  echo "==> Type-checking $app"
  if ! pnpm tsc -p "./apps/$app" --noEmit --incremental; then
    failed+=("$app")
  fi
done

if [[ ${#failed[@]} -eq 0 ]]; then
  echo "All apps passed."
else
  echo "Failed apps: ${failed[*]}"
  exit 1
fi
