#!/usr/bin/env bash
set -e

TYPE=$1
TARGET_TYPE=$(echo "${TYPE/pre/}")
CURRENT=$2
if [ "$CURRENT" = "" ]; then
  CURRENT=$(semver $(git describe --tags --abbrev=0))
fi
TARGET=$(npx semver -i $TARGET_TYPE --preid alpha $CURRENT)
NEXT=$(npx semver -i $TYPE --preid alpha $CURRENT)
BRANCH=r/release-$TARGET

echo CURRENT $CURRENT
echo TARGET $TARGET
echo NEXT $NEXT

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  git fetch origin
  git checkout master
  git checkout $BRANCH || git -b checkout $BRANCH
fi

lerna-changelog --next-version ${NEXT} >>PRERELEASE_CHANGELOG.md
git add PRERELEASE_CHANGELOG.md
git commit -m "chore(release): publish ${NEXT}"
lerna version --conventional-commits --no-changelog --allow-branch $BRANCH --force-git-tag --amend --no-push $NEXT --yes
git push --set-upstream origin $BRANCH
git push --tags --force
if ! gh pr view; then
  gh pr create --title "Release ${TARGET}"
fi
