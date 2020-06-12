![We.Publish](./assets/wepublish.svg 'We.Publish')

## Packages

- [@wepublish/api](./packages/api)
  - DB Adapter:
    - [@wepublish/api-db-mongodb](./packages/api-db-mongodb)
    - ~~[@wepublish/api-db-memory](./packages/api-db-memory)~~ (Currently Unmaintained)
    - ~~[@wepublish/api-db-karma](./packages/api-db-karma)~~ (Currently Unmaintained)
  - Media Adapter:
    - [@wepublish/api-media-karma](./packages/api-media-karma)
- [@wepublish/editor](./packages/editor)

## Demo
- [Editor](https://editor.demo.wepublish.media)
  - username: dev@wepublish.ch, password: 123
- [Website](https://demo.wepublish.media)
- [API](https://api.demo.wepublish.media)

## Development

### Prerequisites

- [Node v12.x.x][node-download-url]
- [Yarn v1.17.x][yarn-download-url]
- [Docker v19.x.x][docker-download-url]

### Recommended

- [VSCode][vscode-download-url]
- [VSCode Prettier Extension][vscode-prettier-download-url]

### Install, Build & Watch

If you're setting up the project for the first time:

```
yarn install && yarn setup && yarn build
```

After that you can start docker-compose and watch all packages via:

```
yarn dev
```

If you rather wish to run docker-compose separately you can just watch the packages via:

```
yarn watch
```

Or if you want to watch only certain packages:

```
yarn run-p watch:api watch:api-example watch:editor
```

The following servers will be available:

- **API:** [http://localhost:4000](http://localhost:4000)
- **Media Server:** [http://localhost:4001](http://localhost:4001)
- **Editor:** [http://localhost:3000](http://localhost:3000)
- **Webpack Dev Server:** [http://localhost:3001](http://localhost:3001)
- **MongoDB:** [http://localhost:27017](http://localhost:27017)
- **MongoDB Express:** [http://localhost:5000](http://localhost:4005)

If you want to build/watch only certain packages just have a look inside the [package.json][package-json-url],
to find commands for each package.

### Debugging Node.js via VSCode

There are several launch configurations that allow you to attach the debugger to the various examples.

[node-download-url]: https://nodejs.org/en/download/current/
[yarn-download-url]: https://yarnpkg.com/en/docs/install
[docker-download-url]: https://www.docker.com/get-started
[vscode-download-url]: https://code.visualstudio.com/Download
[vscode-prettier-download-url]: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode
[package-json-url]: package.json
