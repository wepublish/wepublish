## Branches

Currently we operate based on a few main branches.

- `master` is our main development branch. This represents our most up-to-date code with latest features included. Master is used as base for any release.
- `production` represents our latest stable, production-ready code. It is updated after each release (release-branch is merged into production).
- `<breaking-changes>` contains all the breaking-changes features
- `f/<feature-name>` are feature branches
- `r/<release-name>` branch for release processes
- `b/<bugfix-name>` for bugfixes to release
- `h/<hotfix-name>` for hotfixes to production

## Features

1. Create new branch based on `master`, use `f/<feature-name>` as template for name (you can use Jira ticket name inside)
2. Commit your code
3. Push changes
4. Create pull-request into the `master`
5. Squash and merge pull-request`

## Breaking change features WIP

1. Create new branch based on `<breaking-changes>`, use `f/<feature-name>` as template for name (you can use Jira ticket name inside)
2. Commit your code
3. Push changes
4. Create pull-request into the `<breaking-changes>`
5. Squash and merge pull-request`
6. `<breaking-changes>` is updated with `master` on daily basis
7. Every X months `<breaking-changes>` branch is merged back to `master` and `major` release is done

## Bugfixes

1. Create new branch based on specific release `r/<release-name>` or `master`, use `b/<bugfix-name>` as template for name
2. Commit your code
3. Push changes
4. Create pull-request into the `r/<release-name>` or `master` (depending on the source)
5. Squash and merge pull-request`

## Production hotfixes

1. Create new branch based on production branch `production`, use `h/<bugfix-name>` as template for name
2. Commit your code
3. Push changes
4. Create pull-request into the `production`
5. Squash and merge pull-request`
6. Create new `patch` release

# Releases

## Versioning

We use semantic versioning to indicate changes within our public API.
Major, minor changes within internal private APIs and Editor will be considered as minor or patch.
We assume all components are used with the same version.

## Release process

At this moment we use `git-flow` command for release process. This makes it easy to have a proper state of dev `master` and stable `production` branches.

### In steps

1. Starts right after sprint ends (or whatever time we pick)
2. Identify type of release (`major` | `minor` | `patch`) by reviewing changelog
   - `npx lerna-changelog`
3. Create release branch `r/<release-name>` of dev `master`
   - `git flow release start <version>`
4. Create alpha-prerelease, create tag in github and publish new `next` npm
   - `npx lerna version --no-changelog --allow-branch "r/*" --force-git-tag <version>-alpha.X --yes`
   - Create pull-request with changelog as description
5. Apply bugfixes if needed
   - Again create new pre-release
   - Again add changelog into PR description
6. Once release tested and verified tag and publish final-release
   - Put generated PR changelog into the `CHANGELOG.md`
   - `git commit -m "c/release <version>"`
   - `npx lerna version --amend --no-changelog --allow-branch "r/*" --force-git-tag <version> --yes`
7. Merge release branch back into dev `master` and stable `production`
   - `git flow release finish <version>`
