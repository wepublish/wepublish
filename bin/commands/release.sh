#!/usr/bin/env bash
set -e

function print_help() {
  echo "Usage: $0 {alpha|stable} [arguments]"
  echo "  alpha [increment] - Release an alpha version with optional increment override (major, minor, patch)"
  echo "  stable            - Finalize and release a stable version"
}

if [ $# -eq 0 ]; then
  print_help
  exit 1
fi

SUBCOMMAND=$1
shift

case "$SUBCOMMAND" in
  alpha)
    ./release-alpha.sh "$@"
    ;;
  stable)
    ./release-stable.sh
    ;;
  *)
    echo "Error: Unknown command '$SUBCOMMAND'"
    print_help
    exit 1
    ;;
esac
