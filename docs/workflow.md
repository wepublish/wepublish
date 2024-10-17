# Workflow

## Branching Strategy

- **`master`**: The main development branch, representing the most up-to-date code with the latest features. Used as the
  base for all releases.
- **`f/<feature-name>`**: Feature branches for developing new features.
- **`r/<release-name>`**: Branches for preparing releases.
- **`b/<bugfix-name>`**: Bugfix branches for ongoing releases.
- **`h/<hotfix-name>`**: Hotfix branches for critical fixes to production.

## Workflow Steps

1. **Create a New Branch**: Base it on `master` using the `f/<feature-name>` pattern, incorporating the Jira ticket name
   where applicable.
2. **Commit Changes**: Regularly commit your changes to your branch.
3. **Push Changes**: Push your changes to the remote repository.
4. **Create a Pull Request**: Initiate a pull request into `master`.
5. **Squash and Merge**: Once reviewed and approved, squash and merge the pull request.

## Conventional Commits

We use conventional commits to ensure that commit messages are standardized and meaningful. Please adhere to this format
for consistency. https://www.conventionalcommits.org/en/v1.0.0/#summary

## GitHub Labels for PRs

Use GitHub labels to categorize pull requests and ensure they are correctly identified in the changelog:

- `PR: Breaking Change :boom:`
- `PR: New Feature :heart:`
- `PR: Bug Fix :bug:`
- `PR: Polish :nail_care:`
- `PR: Docs :memo:`
- `PR: Internal :house:`
- `PR: Revert :leftwards_arrow_with_hook:`

## Handling Production Hotfixes

For urgent fixes:

- Create a fix branch based on the appropriate release branch.
- Follow the release process to create a new patch version.

## Release Management

### Versioning

We adhere to semantic versioning. Changes within our public API dictate the version bump:

- **Major**: Incompatible API changes.
- **Minor**: Add functionality in a backwards-compatible manner.
- **Patch**: Backwards-compatible bug fixes.

### Release Process Overview

The release cycle is highly flexible and runs at a time set by the development team.

#### Steps for Releasing

1. **Create Alpha Pre-release**
    - Determine the release type (`major`, `minor`, `patch`) by reviewing changes.
    - Execute the release command:
      ```bash
      ./bin/release alpha
      ```
    - This command updates `master`, creates a release branch, tags the version, generates the changelog, and creates a
      pull request if necessary.

2. **Apply Bug Fixes and Iterative Pre-releases (Optional)**
    - Address bugs as needed on the release branch, generating subsequent alpha versions:
      ```bash
      ./bin/release alpha
      ```
    - Update the pull request description with the latest changelog.

3. **Publish Final Release**
    - Finalize the release once it's fully tested and approved:
      ```bash
      ./bin/release stable
      ```
    - This completes the changelog, commits the final changes, and pushes all modifications along with tags.

### Additional Information

- Execute all commands from the root of the repository.
- Ensure necessary environment variables like `GITHUB_AUTH` are set before starting.
- The `release alpha` command optionally accepts an increment type, while `release stable` does not require additional
  arguments. Run `./bin/release` for help. 
