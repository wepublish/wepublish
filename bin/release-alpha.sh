#!/usr/bin/env bash
set -e

if [[ $(git diff) ]]; then
  echo 'Cannot have uncommitted changes'
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ $CURRENT_BRANCH != r/release-* ]]; then
  git checkout master
  git pull origin master
  CURRENT_BRANCH=master
fi

LAST_STABLE_TAG=$(git describe --tags --exclude "*alpha*" --abbrev=0)
LAST_TAG=$(git describe --tags --abbrev=0)

# Create changelog and determing increment type
echo "Determine increment type vs ${CURRENT_BRANCH}"
npx lerna-changelog --from=${LAST_STABLE_TAG} > .CHANGELOG-next.md
if [[ $(cat .CHANGELOG-next.md | grep "#### :" | grep "Breaking") ]]; then
  INCREMENT=major
elif [[ $(cat .CHANGELOG-next.md | grep "#### :" | grep -v "Bux Fix") ]]; then
  INCREMENT=minor
else
  INCREMENT=patch
fi
rm .CHANGELOG-next.md

NEXT_STABLE_VERSION=$(semver -i ${INCREMENT} ${LAST_STABLE_TAG})
NEXT_STABLE_VERSION_BRANCH=r/release-${NEXT_STABLE_VERSION}

# Checkout new branch if determined version is different than current branch
if [[ $CURRENT_BRANCH != $NEXT_STABLE_VERSION_BRANCH ]]; then
  echo "Checkout target release branch: ${NEXT_STABLE_VERSION_BRANCH}"
  if [[ $(git branch | grep "${NEXT_STABLE_VERSION_BRANCH}") ]]; then
  echo "Branch ${NEXT_STABLE_VERSION_BRANCH} already exists, checkout the branch and rerun command"
    exit 1
  fi
  git checkout -b ${NEXT_STABLE_VERSION_BRANCH}
  git push -u origin ${NEXT_STABLE_VERSION_BRANCH}
fi

# Define increment or prerelease
if [[ $LAST_TAG = $LAST_STABLE_TAG ]]; then
  NEXT_INCREMENT="pre${INCREMENT}"
else
  NEXT_INCREMENT="prerelease"
fi

NEXT_VERSION=$(semver -i ${NEXT_INCREMENT} ${LAST_TAG})
echo "Creating new ${NEXT_INCREMENT} version ${NEXT_VERSION}"
lerna version $NEXT_VERSION

npx lerna-changelog --from=${LAST_STABLE_TAG} > .CHANGELOG-next.md
if [[ $(gh pr view) ]]; then
  echo 'Editing PR body'
  gh pr edit --body-file .CHANGELOG-next.md
else
  echo 'Creating PR'
    gh pr create --title "Release ${NEXT_STABLE_VERSION}" --body-file .CHANGELOG-next.md
fi
rm .CHANGELOG-next.md
