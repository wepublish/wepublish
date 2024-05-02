## Branches

Currently we operate based on a few main branches.

- `master` is our main development branch. This represents our most up-to-date code with latest features included.
  Master is used as base for any release.
- `production` represents our latest stable, production-ready code. It is updated after each release (release-branch is
  merged into production).
- `<breaking-changes>` contains all the breaking-changes features
- `f/<feature-name>` are feature branches
- `r/<release-name>` branch for release processes
- `b/<bugfix-name>` for bugfixes to release
- `h/<hotfix-name>` for hotfixes to production

## Features

1. Create new branch based on `master`, use `f/<feature-name>` as template for name (you can use Jira ticket name
   inside)
2. Commit your code
3. Push changes
4. Create pull-request into the `master`
5. Squash and merge pull-request`

## Breaking change features WIP

1. Create new branch based on `<breaking-changes>`, use `f/<feature-name>` as template for name (you can use Jira ticket
   name inside)
2. Commit your code
3. Push changes
4. Create pull-request into the `<breaking-changes>`
5. Squash and merge pull-request`
6. `<breaking-changes>` is updated with `master` on daily basis
7. Every X months `<breaking-changes>` branch is merged back to `master` and `major` release is done

## Bugfixes

1. Create new branch based on specific release `r/<release-name>` or `master`, use `b/<bugfix-name>` as template for
   name
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

## Release Process

### Overview

The release process starts right after the sprint ends, or at a predetermined time chosen by the development team. This
process includes creating alpha and stable versions, managing branches, and handling pull requests.

### Steps for Releasing

1. **Create Alpha Pre-release**
    - At the end of the sprint, identify the type of release (`major`, `minor`, `patch`) by reviewing changes and then
      use the `release alpha` command to create an alpha pre-release. If needed, specify the increment type:
      ```
      ./bin/release alpha [major|minor|patch]
      ```
    - This command automatically handles:
        - Updating the `master` branch and creating a new release branch named `r/release-<version>`
        - Tagging the version with `-alpha.X` suffix
        - Generating a changelog using `npx lerna-changelog`
        - Creating a pull request with the changelog as the description, if one does not exist

2. **Apply Bug Fixes and Iterative Pre-releases (Optional)**
    - Apply bug fixes on the release branch as necessary. Subsequent alpha versions can be generated:
      ```
      ./bin/release alpha
      ```
    - Include updated changelog entries in the pull request description with each pre-release.

3. **Publish Final Release**
    - Once the release has been tested and verified, finalize the release using the `release stable` command, which
      performs the following:
      ```
      ./bin/release stable
      ```
    - This command handles:
        - Finalizing the changelog entries using lerna-changelog
        - Committing these changes with a release tag
        - Pushing all changes and tags automatically

### Additional Information

- All commands are to be run from the root of the repository.
- Ensure that the environment variables such as `GITHUB_AUTH` are set correctly before starting the release process.
- The `release alpha` command can optionally take an increment type as an argument, while `release stable` does not take
  any arguments.
