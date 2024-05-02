#!/usr/bin/env bash
set -e

# Make sure there are no pending git changes
if [[ $(git diff) ]]; then
  echo 'Cannot have uncommitted changes'
  exit 1
fi

# Check for GitHub authentication token
if [ -z "$GITHUB_AUTH" ]; then
  echo "Error: The GITHUB_AUTH environment variable is not set."
  echo "Please set this variable to your GitHub personal access token."
  exit 1
fi

# Allow to override the Increment
INCREMENT=$1

# Check if the increment type is valid if passed
if [[ -n "$INCREMENT" && ! "$INCREMENT" =~ ^(major|minor|patch)$ ]]; then
  echo "Error: Invalid increment type '$INCREMENT'."
  echo "Allowed types are: major, minor, patch."
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

# Create changelog and base on it determine increment type
echo "Determine increment type vs ${CURRENT_BRANCH}"
npx lerna-changelog --from=${LAST_STABLE_TAG} > .CHANGELOG-next.md
if [ -z "$INCREMENT" ]; then
  if [[ $(cat .CHANGELOG-next.md | grep "#### :" | grep "Breaking") ]]; then
    INCREMENT=major
  elif [[ $(cat .CHANGELOG-next.md | grep "#### :" | grep -v "Bug Fix") ]]; then
    INCREMENT=minor
  else
    INCREMENT=patch
  fi
fi
rm .CHANGELOG-next.md

# Determine next stable version and its branch
NEXT_STABLE_VERSION=$(semver -i ${INCREMENT} ${LAST_STABLE_TAG})
NEXT_STABLE_VERSION_BRANCH=r/release-${NEXT_STABLE_VERSION}


# Checkout into the target branch if it's different than current branch
if [[ $CURRENT_BRANCH != $NEXT_STABLE_VERSION_BRANCH ]]; then
  echo "Checkout target release branch: ${NEXT_STABLE_VERSION_BRANCH}"
  if [[ $(git branch | grep "${NEXT_STABLE_VERSION_BRANCH}") ]]; then
  echo "Branch ${NEXT_STABLE_VERSION_BRANCH} already exists, checkout the branch and rerun command"
    exit 1
  fi
  git checkout -b ${NEXT_STABLE_VERSION_BRANCH}
  git push -u origin ${NEXT_STABLE_VERSION_BRANCH}
fi

# Define lerna release type
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
