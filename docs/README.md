








<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/wepublish/wepublish">
    <img src="./assets/logo.png" alt="Logo" height="43">
  </a>

  <h3 align="center">We.Publish Documentation</h3>

  <p align="center">
    Open Source Headless CMS for Publishers and News Rooms
    <br />
    <!-- <a href="https://github.com/github_username/repo_name"><strong>Explore the docs »</strong></a>-->
    <br />
    <br />
    <a href="#demo">View Demo</a>
    ·
    <a href="https://github.com/wepublish/wepublish/issues">Report Bug</a>
    ·
    <a href="https://github.com/wepublish/wepublish/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
## Table of Contents

* [Setup Commenting](commenting.md)
* [Email Templates](emailtemplates.md)
* [Releases](Releases.md)


## packages/editor
### How to call an api endpoint from the UI (.tsx file)?
Prerequisite: In the API (packages/api) exists a corresponding GraphQL endpoint.

1) In `editor/src/client/api` you have to create a corresponding graphql file or define your mutation or query in an existing one.
2) Start the API (`yarn watch`)
3) Navigate in your terminal to `packages/editor` and run `yarn generate:api`
4) Now the file `index.ts` will be generated automatically `in editor/src/client/api`
5) Now you can import your desired endpoint in your .tsx file. See for example `subscriptionEditPanel.tsx`

## packages/api
### Subscriptions
#### Receiving webhooks from payment providers such as Stripe or Payrexx
The webhook will call `paymentProvider.updatePaymentWithIntentState()` which will create a payment.
This creates a payment creation event which is caught by `paymentProvider.setupPaymentProvider()`.
Within this event another invoice event will be triggered which is handled in `events.invoiceModelEvents()`

## packages/mongo-db
### Migrations
To perform migrations on the database two steps are necessary.
1. add an object in migrations.ts.
2. restart the API (yarn watch)

