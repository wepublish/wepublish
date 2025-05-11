#!/usr/bin/env bash

DAYS_OLD=90
CUTOFF_TIMESTAMP=$(date -d "$DAYS_OLD days ago" +%s)
git fetch --tags

# List tags that start with 'deploy_'
for tag in $(git tag -l "deploy_*"); do
  # Get the commit timestamp (in Unix epoch) for the tag.
  TAG_TIMESTAMP=$(git log -1 --format="%ct" "$tag")

  # Check if the commit timestamp is older than the cutoff.
  if [ "$TAG_TIMESTAMP" -lt "$CUTOFF_TIMESTAMP" ]; then
    echo "Deleting tag '$tag' (commit date older than $DAYS_OLD days)..."
    git tag -d "$tag"
    git push origin :refs/tags/"$tag"
  fi
done
