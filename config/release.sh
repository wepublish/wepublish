#!/usr/bin/env bash
set -e

# Check if all required libs are present
if (! which -s git jq gh lerna-changelog lerna semver); then
  echo 'Missing one of dependencies: git jq gh lerna-changelog lerna semver'
  exit 1;
fi

TYPE=$1
TARGET_TYPE=$(echo "${TYPE/pre/}")

# Define current, next, target versions based on release-type
CURRENT=$2
if [ "$CURRENT" = "" ]; then
  CURRENT=$(semver $(cat packages/api/package.json| jq .version --raw-output))
fi
TARGET=$(yarn --silent run semver -i $TARGET_TYPE --preid alpha $CURRENT)
NEXT=$(yarn --silent run semver -i $TYPE --preid alpha $CURRENT)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Print out informational data
echo CURRENT $CURRENT
echo TARGET $TARGET
echo NEXT $NEXT

# Generate changelog
yarn run --silent lerna-changelog --next-version ${NEXT}
TEMP_CHANGELOG=$(mktemp)
yarn run --silent lerna-changelog --next-version ${NEXT} > TEMP_CHANGELOG
cat CHANGELOG.md >> TEMP_CHANGELOG
cat TEMP_CHANGELOG > CHANGELOG.md
git add PRERELEASE_CHANGELOG.md
git commit -m "chore(release): publish ${NEXT}"

# Publish packages via lerna
yarn run lerna version --conventional-commits --no-changelog --allow-branch $BRANCH --force-git-tag --amend --no-push $NEXT --yes
git push --set-upstream origin $BRANCH

# Create pull-request to production branch on github
if ! gh pr view; then
  gh pr create --base production --title "Release ${TARGET}"
fi
