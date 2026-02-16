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

[![GitHub tag (latest by date)][tag-shield]][tag-url]
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

# We.Publish

<div align="center">
  <img src="assets/wepublish.svg" alt="We.Publish Logo" width="300" />
  <h3>Open Source Headless CMS & Peering Network</h3>
  <p>For independent media with shared technology and content.</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**Read the full Docs »**](https://we-publish.gitbook.io/we.publish)

[View Demo](#demo) · [Report Bug](https://github.com/wepublish/wepublish/issues) · [Request Feature](https://github.com/wepublish/wepublish/issues)

</div>

---

## The Project

**We.Publish** is more than just a CMS; it is a journalistic ecosystem designed to strengthen independent journalism and freedom of the press.

By providing a modern, open-source **Headless CMS**, we enable publishers to create, manage, and engage with their audience effectively. Unlike traditional CMS platforms, We.Publish features a unique **Peering Network**, allowing connected newsrooms to share content seamlessly, expand their reach, and collaborate on stories.

In addition to its headless capabilities, We.Publish includes a powerful **Website Builder**. This tool allows developers to quickly spin up fully functional websites for media outlets, complete with necessary components and pre-configured connections to the API and CMS editor.

**We are experienced in launching new media.**
With our specialized product **we.start**, we support local initiatives to found and grow independent journalistic media in their city, town, or region. By joining our network, you not only get the technology but also access to shared expertise and experience from a community dedicated to the success of independent journalism and the freedom of the press.

### Key Features

#### Editorial & Content

- **Advanced Block Editor**: Create rich content with titles, galleries, listicles, quotes, embeds, polls, events, and tables.
- **Media Management**: Integrated image library with automatic metadata import and optimized delivery for all devices.
- **SEO & Scheduling**: Built-in SEO optimizations and scheduled publication features.

#### Community & Peering

- **Peering Network**: Seamlessly share and publish articles across different newsrooms within the network.
- **Engagement Tools**: Moderated comment system, polls, and integrated crowdfunding to build a loyal community.
- **Author Profiles**: Dedicated pages and profiles for your journalists.

#### Business & Memberships

- **Powerful Subscription System**: Flexible subscription models, paywalls, and automatic renewal management.
- **Dashboard & Analytics**: Track audience engagement and subscription metrics.
- **Integrations**: Native support for payments (Stripe, Payrexx, Mollie), invoicing (Bexio), and email marketing (Mailchimp, Mailgun).

#### Technical & Architecture

- **Headless & API-First**: Decoupled architecture using GraphQL, NestJS, and React.
- **Website Builder**: Rapidly spin up connected websites with pre-built components.
- **Granular Permissions**: Role-based access control for editors, community managers, and admin staff.
- **Monorepo**: Managed with [Nx](https://nx.dev) for scalable development.

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v22+)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **API**: [NestJS](https://nestjs.com/) & [GraphQL](https://graphql.org/)
- **Frontend**: [Next.js](https://nextjs.org/) & [React](https://reactjs.org/)
- **UI Framework**: [MUI](https://mui.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) & [Prisma](https://www.prisma.io/)
- **Workspace**: [Nx](https://nx.dev/)

## Getting Started

Follow these steps to set up your local development environment.

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (v22.20.0 or higher)
- [Docker](https://www.docker.com/products/docker-desktop) & Docker Compose
- [Git](https://git-scm.com/)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/wepublish/wepublish.git
    cd wepublish
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Start the development environment**
    This command starts the database and storage services via Docker, runs migrations, and launches the API, Editor, and Website in watch mode.

    ```bash
    npm run dev
    ```

    > **Note**
    > The first start might take a few moments as it seeds the database and builds the applications.

### Access Points

Once the development server is running, you can access the applications at:

| Application         | URL                                                            | Default Credentials        |
| :------------------ | :------------------------------------------------------------- | :------------------------- |
| **Editor (CMS)**    | [http://localhost:4200](http://localhost:4200)                 | `dev@wepublish.ch` / `123` |
| **Website Example** | [http://localhost:4300](http://localhost:4300)                 | -                          |
| **API**             | [http://localhost:4000/graphql](http://localhost:4000/graphql) | -                          |
| **Media Server**    | [http://localhost:3000](http://localhost:4000)                 | -                          |

_(Note: Port numbers may vary based on your local configuration or `nx.json` setups. Check terminal output for exact URLs.)_

## Project Structure

This project is organized as an Nx monorepo:

- **`apps/`**
  - `api-example`: The backend GraphQL API server.
  - `editor`: The back-office React application for content management.
  - `website-example`: A reference frontend implementation.
  - `media`: Service for handling image and file assets.
- **`libs/`**: Shared libraries containing core logic (api, utils, ui components).
  - _Note_: Many libraries (e.g., `article`, `page`) include a `website/` folder. These modular components power our **Website Builder**, facilitating the rapid assembly of connected websites.

## Running Tests

To run the test suite across the entire workspace:

```bash
npm run test
```

Or run tests for a specific project:

```bash
npx nx test api-example
```

## Documentation

For comprehensive guides on architecture, deployment, and usage, please visit our official documentation:

**[https://we-publish.gitbook.io/we.publish](https://we-publish.gitbook.io/we.publish)**

## Contributing

We welcome contributions from the community!

1.  Fork the Project
2.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
3.  Push to the Branch (`git push origin feature/AmazingFeature`)
4.  Open a Pull Request

Please review our [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for more details.

## Demo

- [Editor](https://editor-wepublish-site.wepublish.dev)
  - username: `admin@wepublish.ch`
  - password: `demo`
- [Website](https://wepublish-site.wepublish.dev)
- [API V1](https://api-wepublish-site.wepublish.dev/v1)
- [API Admin](https://api-wepublish-site.wepublish.dev/v1/admin)

## Services & Offers

While We.Publish is open source and free to use, the **We.Publish Foundation** offers professional services to help you get the most out of the platform.

**Get we.start | New Media Launchpad**: A specialized package for startups founding new media in their city or region. Includes technical setup, network access, and guidance to succeed in the market.

- **Managed Hosting & Maintenance**: Secure and reliable hosting solutions.
- **Custom Development**: Tailored feature implementation and modifications.
- **Consulting & Support**: Expert guidance for your media project and access to our network's shared expertise for the good of press freedom

### Trusted by Independent Media

Many news sites have been successfully powered by We.Publish for years. We are proud to support a diverse ecosystem of independent journalism:

<table align="center">
  <tr>
    <td align="center"><a href="https://reflekt.ch"><b>REFLEKT</b></a></td>
    <td align="center"><a href="https://bajour.ch/"><b>Bajour</b></a></td>
    <td align="center"><a href="https://tsri.ch/"><b>Tsüri.ch</b></a></td>
    <td align="center"><a href="https://www.hauptstadt.be/"><b>Hauptstadt</b></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://onlinereports.ch/"><b>OnlineReports</b></a></td>
    <td align="center"><a href="https://wnti.ch/"><b>Wnti.ch</b></a></td>
    <td align="center"><a href="https://mannschaft.com/"><b>Mannschaft</b></a></td>
    <td align="center"><a href="https://zwoelf.ch/"><b>Zwölf</b></a></td>
  </tr>
    <tr>
    <td align="center"><a href="https://flimmer.media/"><b>Flimmer</b></a></td>
    <td align="center"><a href="https://wav.info/"><b>Wav</b></a></td>
    <td align="center"><a href="https://bka.ch/"><b>BKA</b></a></td>
    <td align="center"><a href="https://xn--cltr-0rac.ch/"><b>Cültür</b></a></td>
  </tr>
</table>

**Contact us at [info@wepublish.ch](mailto:info@wepublish.ch)**

**Self-Hosting & Community Support**:
If you are self-hosting We.Publish, please reach out to us via email. We would love to add you to our Slack channel, connecting you directly with our IT team and the wider We.Publish developer community.

Project Link: [https://github.com/wepublish/wepublish](https://github.com/wepublish/wepublish)

## License

Distributed under the MIT License. See `LICENSE` for more information.
