<!--
*** Thanks for checking out this README Template. If you have a suggestion that would
*** make this better, please fork the repo and create a pull request or simply open
*** an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
***
***
***
*** To avoid retyping too much info. Do a search and replace for the following:
*** github_username, repo_name, twitter_handle, email
-->

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![CI][cicd-shield]][cicd-url]
[![GitHub tag (latest by date)][tag-shield]][tag-url]
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/wepublish/wepublish">
    <img src="assets/wepublish.svg" alt="Logo" width="245" height="43">
  </a>

  <h3 align="center">we.publish</h3>

  <p align="center">
    Open Source Headless CMS for Publishers and News Rooms
    <br />
    <!-- <a href="https://github.com/github_username/repo_name"><strong>Explore the docs »</strong></a>-->
    <br />
    <br />
    <a href="#demo-stable">View Demo</a>
    ·
    <a href="https://github.com/wepublish/wepublish/issues">Report Bug</a>
    ·
    <a href="https://github.com/wepublish/wepublish/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [About the Project](#about-the-project)
  - [Built With](#built-with)
- [Demo](#demo-stable)
- [Packages](#packages)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Docs](#docs)
- [Code of Conduct](#code-of-conduct)
- [License](#license)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->

## About The Project

<!--[![Product Name Screen Shot][product-screenshot]](https://example.com)-->

TBD

### Built With

- [Node.js](https://nodejs.org/)
- [GraphQL](https://graphql.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- :green_heart:

## Demo (Stable)

- [Editor](https://editor-wepublish-site.wepublish.dev)
  - username: `admin@wepublish.ch`
  - password: `demo`
- [Website](https://wepublish-site.wepublish.dev)
- [API V1](https://api-wepublish-site.wepublish.dev/v1)
- [API Admin](https://api-wepublish-site.wepublish.dev/v1/admin)

## Packages

- [@wepublish/api](./libs/api)
- [@wepublish/editor](./apps/editor)

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

- [Node v18.x.x][node-download-url]
- [Docker v19.x.x][docker-download-url]

### Installation

1. Clone the repo

```sh
git clone https://github.com/wepublish/wepublish.git
cd wepublish
```

2. Install NPM packages

```sh
npm i
```

3. Build project.

```sh
npm run build
```

4a. Test wepublish (the initial admin login is red printed in the log at first startup)

```sh
npm run try
```

4b. Run the project (starts a postgresql with Docker)

```sh
npm run dev
```

If you rather wish to run docker-compose separately you can just watch the packages via:

```sh
npm run watch
```

Or if you want to watch only certain packages:

```
npx run-p watch:api watch:api-example watch:editor
```

<!-- USAGE EXAMPLES -->

## Usage

- **Website:** [http://localhost:4200](http://localhost:4200)
- **API:** [http://localhost:4000](http://localhost:4000)
- **Media Server:** [http://localhost:4100](http://localhost:4100)
- **Editor:** [http://localhost:3000](http://localhost:3000)
- **Webpack Dev Server:** [http://localhost:3001](http://localhost:3001)
- **Postgresql:** [http://localhost:5432](http://localhost:5432)
- **PGAdmin:** [http://localhost:8000](http://localhost:8000)

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.
A good place to start is with an issue that has the label [good first issue](https://github.com/wepublish/wepublish/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b f/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin f/AmazingFeature`)
5. Open a Pull Request

## Docs

All code documentation lives in the [docs folder.][documentation-url]

## Code of Conduct

We.publish is dedicated to building a welcoming, diverse, safe community.
We expect everyone participating in the we.publish community to abide by our [Code of Conduct][code-of-conduct-url].
Please read it. Please follow it.

<!-- FAQ -->

## Troubleshooting

If you encounter problems you can check our [FAQ][faq-md-url] or write us [dev@wepublish.ch](mailto:dev@wepublish.ch).

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->

## Contact

We.Publish - [@WePublish_media](https://twitter.com/WePublish_media) - [dev@wepublish.ch](mailto:dev@wepublish.ch)

Website: [https://www.wepublish.ch/](https://www.wepublish.ch/)

<!-- ACKNOWLEDGEMENTS -->

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[cicd-shield]: https://github.com/wepublish/wepublish/workflows/CI%2FCD/badge.svg
[cicd-url]: https://github.com/wepublish/wepublish/actions?query=workflow%3ACI%2FCD
[tag-shield]: https://img.shields.io/github/v/tag/wepublish/wepublish?style=flat
[tag-url]: https://github.com/wepublish/wepublish/tags
[contributors-shield]: https://img.shields.io/github/contributors/wepublish/wepublish.svg?style=flat
[contributors-url]: https://github.com/wepublish/wepublish/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/wepublish/wepublish.svg?style=flat
[forks-url]: https://github.com/wepublish/wepublish/network/members
[stars-shield]: https://img.shields.io/github/stars/wepublish/wepublish.svg?style=flat
[stars-url]: https://github.com/wepublish/wepublish/stargazers
[issues-shield]: https://img.shields.io/github/issues/wepublish/wepublish.svg?style=flat
[issues-url]: https://github.com/github_username/repo/issues
[license-shield]: https://img.shields.io/github/license/github_username/repo.svg?style=flat
[license-url]: https://github.com/wepublish/wepublish/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/company/we-publish
[product-screenshot]: images/screenshot.png
[node-download-url]: https://nodejs.org/en/download/current/
[docker-download-url]: https://www.docker.com/get-started
[vscode-download-url]: https://code.visualstudio.com/Download
[vscode-prettier-download-url]: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode
[package-json-url]: package.json
[faq-md-url]: FAQ.md
[code-of-conduct-url]: CODE_OF_CONDUCT.md
[documentation-url]: docs/README.md