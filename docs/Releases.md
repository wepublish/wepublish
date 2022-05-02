# Releases

## Versioning

We use [semantic versioning]((https://semver.org/)) to indicate changes within our public API.
Major, minor changes within internal private APIs and Editor will be considered as minor or patch.
We assume all components are used with the same version.

## Release process

### Alpha pre-release
Before any major, minor, patch release is made we create an alpha pre-release.
This is done via command line starting the release process:
```
yarn release premajor|preminor|prepatch
``` 

Above command will:
1. Identify next major|minor|patch version (e.g `major 2.12.4 -> 3.0.0`)
2. Create version branch based on `master` if not exists (e.g. `r/release-3.0.0`)
3. Create PRERELEASE-CHANGELOG.md
4. Push your changes to remote branch, create and publish alpha git tag
5. Create pull-request for the release
6. Every published tag will trigger npm publish

### Alpha release bump

```
git checkout r/release-3.0.0
yarn release prerelease
```

Above command will:
1. Add to PRERELEASE-CHANGELOG.md
2. Push your current branch state to remote branch, create and publish alpha git tag
3. Every published tag will trigger npm publish


### Finalizing release

Once work via pre-releases is done and you want to release actual non-alpha release you need to merge release pull-request into the master branch.
Above merge will trigger action that will:

1. Add release notes to CHANGELOG.md
2. Create and publish final git tag
3. Every published tag will trigger npm publish
