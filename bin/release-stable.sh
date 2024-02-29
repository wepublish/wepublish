#!/usr/bin/env bash
set -e

if [[ $(git diff) ]]; then
  echo 'Cannot have uncommitted changes'
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
VERSION=${BRANCH#"r/release-"}
LAST_STABLE_TAG=$(git describe --tags --exclude "*alpha*" --abbrev=0)

# Create changelog
git tag -d $(git tag --contains=${LAST_STABLE_TAG} | grep alpha)
head -n 1 CHANGELOG.md > CHANGELOG-new.md
npx lerna-changelog --from=${LAST_STABLE_TAG} --next-version=${VERSION} >> CHANGELOG-new.md
tail -n +2 CHANGELOG.md >> CHANGELOG-new.md
mv CHANGELOG-new.md CHANGELOG.md
git fetch --tags

# Bump versions
git commit -am "chore(release): ${VERSION}"
npx lerna version ${VERSION} --amend --yes
