#!/usr/bin/env bash
set -uo pipefail

EXCLUDE=("api-example" "editor" "bka" "media")
failed=()

for dir in apps/*/; do
  app="$(basename "$dir")"

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
  if ! npx tsc -p "./apps/$app" --noEmit --incremental; then
    failed+=("$app")
  fi
done

if [[ ${#failed[@]} -eq 0 ]]; then
  echo "All apps passed."
else
  echo "Failed apps: ${failed[*]}"
  exit 1
fi
