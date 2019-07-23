# we.publish

## Getting Started

## Development

### Prerequisites

- [Yarn v1.16.0](yarn-download-url)

## Recommended

- [VSCode](vscode-download-url)
- [VSCode Prettier Extension](vscode-prettier-download-url)

## Install, Build & Watch

If you're setting up the project for the first time:

```
yarn install && yarn build
```

After that you can watch all packages via:

```
yarn watch
```

The following servers will be available:

- API: [http://localhost:3000](http://localhost:3000)
- Editor: [http://localhost:3030](http://localhost:3030)
- Editor Storybook: [http://localhost:3002](http://localhost:3002)
- Website: [http://localhost:8000](http://localhost:8000)
- Webpack Dev Server: [http://localhost:8080](http://localhost:8080)

If you want to build/watch only certain packages just have a look inside the [package.json](package-json-url),
to find commands for each package.

## Debugging via VSCode

There are several launch configurations that allow you to attach the debugger to the various examples.

[yarn-download-url]: https://yarnpkg.com/en/docs/install
[vscode-download-url]: https://code.visualstudio.com/Download
[vscode-prettier-download-url]: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode
[package-json-url]: package.json
