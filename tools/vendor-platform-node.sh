#!/usr/bin/env bash
#
# Re-vendors @nestjs/platform-node from the unreleased upstream branch into
# vendor/nestjs-platform-node/src.
#
# The package is not on npm; it only exists in nestjs/nest#18063. See
# vendor/nestjs-platform-node/README.md.
#
# Usage:
#   ./tools/vendor-platform-node.sh [commit-sha]

set -euo pipefail

UPSTREAM_REPO="https://github.com/nestjs/nest.git"
UPSTREAM_BRANCH="feat/platform-node"
DEFAULT_COMMIT="2b10fb228353fcaedd2817cc22f89ad1cca9a900"

COMMIT="${1:-$DEFAULT_COMMIT}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$REPO_ROOT/vendor/nestjs-platform-node"
SRC_DIR="$VENDOR_DIR/src"

WORK_DIR="$(mktemp -d)"
cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

echo "Cloning $UPSTREAM_REPO#$UPSTREAM_BRANCH ..."
git clone --quiet --branch "$UPSTREAM_BRANCH" --single-branch "$UPSTREAM_REPO" "$WORK_DIR/nest"
git -C "$WORK_DIR/nest" checkout --quiet "$COMMIT"

COMMIT_DATE="$(git -C "$WORK_DIR/nest" log -1 --format=%ad --date=short)"
PKG_VERSION="$(node -p "require('$WORK_DIR/nest/packages/platform-node/package.json').version")"

if [ ! -d "$WORK_DIR/nest/packages/platform-node" ]; then
  echo "error: packages/platform-node does not exist at $COMMIT" >&2
  exit 1
fi

echo "Copying sources ..."
rm -rf "$SRC_DIR"
mkdir -p "$SRC_DIR"
rsync -a \
  --exclude 'test' \
  --exclude 'tsconfig*.json' \
  --exclude 'package.json' \
  --exclude 'Readme.md' \
  "$WORK_DIR/nest/packages/platform-node/" "$SRC_DIR/"

echo "Updating provenance in README ..."
README="$VENDOR_DIR/README.md"
tmp_readme="$WORK_DIR/README.md"
sed \
  -e "s#^| Upstream commit |.*#| Upstream commit | \`$COMMIT\` ($COMMIT_DATE) |#" \
  -e "s#^| Upstream version |.*#| Upstream version | \`$PKG_VERSION\` |#" \
  "$README" > "$tmp_readme"
mv "$tmp_readme" "$README"

echo
echo "Vendored $(find "$SRC_DIR" -name '*.ts' | wc -l | tr -d ' ') files at $COMMIT."
echo "Next: npm install (the package is wired as a file: dependency and builds on install)."
