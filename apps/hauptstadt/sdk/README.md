# We.Publish SDK
The We.Publish SDK contains a library of re-usable code to integrate a frontend with a We.Publish api.

# Prequesites
The SDK only works in combination with
- nuxt
- @nuxtjs/axios
- @nuxtjs/apollo
- apollo-cache-inmemory
- graphql
- graphql-tag

Only if using components
- VueJs
- Vuetify

# Get started
- `npm install`
- Include the SDK as a sub repo into your frontend project (https://git-scm.com/book/en/v2/Git-Tools-Submodules)

# Update instructions
## 8.0.0 >>> 9.3.0
- Implement Registration View. LoginForm.vue redirects to path `to="/auth/register"`

## 8.0.0 >>> 8.0.0 14.05.2023
- Implement cacheGuard store module in your vuex store. It is used in PageService.ts, PeerArticleService.ts and ArticleService.ts
  - Create a new file `cacheGuard.ts` in the `store` folder with the following content: `export default CacheGuard.ExtractVuexModule(CacheGuard)`

## 8.0.0 >>> 8.0.0 25.02.2023
- Add two new variables to nuxt.config
  - `PAYREXX_INVOICE_ONLY_SLUG: 'payrexx-invoice-only'` // the payment slug for invoices only
  - `AUTO_CHARGE_PAYMENT_METHOD_SLUGS: ['stripe']` // the payment slug for auto charging payments

## 8.0.0 >>> 8.0.0 Januar 2022
- Replace `CreatePaymentFromInvoiceResponse` with `PaymentResponse`

## 4.1.1 >>> 8.0.0
- Rename `WepPublicationType` to `WepPublicationTypeName`
- Rename `CommentItemType` as well to `WepPublicationTypeName`
- Replace in the `getMemberPlans()` method variable `first` with `take`

## 4.1.0-alpha.0 >>> 4.1.1

- `/sdk/wep/components/memberPlan/CreateMemberPlan.vue` titles in `CreateMemberPlan.vue` and `PaymentForm.vue` have been removed. You may want to add the following slots to replace them:
  - `selectAmountTitle`
  - `selectPaymentMethodTitle`
  - `spamTitle`
  - `label` >>> `sliderLabel`

## 3.1.0-alpha.0 >>> 4.1.0-alpha.0
- `/sdk/wep/components/subscription/DeactivatedSubscriptions.vue` title has been removed. Eventually add new one for your media.
- `/sdk/wep/components/subscription/UserSubscriptionView.vue` title has been removed. Eventually add new one for your media.
- `/sdk/wep/components/invoice/OpenInvoice.vue` title has been removed. Eventually add new one for your media.
- Add `DEACTIVATED_ABOS_PATH` in `nuxt.config.js` file
- Add `ABO_DETAILS_PATH` in `nuxt.config.js` file. You should use `:subscriptionId` in the path.
- Add `OPEN_INVOICE_PATH` in `nuxt.config.js` file. You should use `:invoiceId` in the path.
- Add `LOGIN_PATH` in `nuxt.config.js` file.
- Removed label and labelCss props in `src/wep/components/memberPlan/CreateMemberPlan.vue`. Instead use named slot `label`
- At the place, where you implement `src/wep/components/memberPlan/CreateMemberPlan.vue` you have to add `registrationFormFields` prop.
- Pass DollarApollo prop to `auth/login` method in `/sdk/wep/store/auth.ts`

### latest to 3.1.0-alpha.0
- Update path to new location `/sdk/wep-cms/models/paywall/*`

# Folder structure
The SDK is divided in two different api interfaces.
- wep: to be used with We.Publish api
- wep-cms: to be used with We.Publish cms (https://cms.staging.wepublish.cloud/)

Each of it contains the following folder structure

## Models
Representing the data structure of We.Publish in classes.

### Plural models
Should be implemented along `/sdk/wep/models/comment/Ratings.ts`.

For a usage example see `/sdk/wep/models/comment/Comment.ts`

## Services
Classes to crud data from the We.Publish api. Each model has it's own service class.
Each service class extends the parent `service.ts` class.

## components
Components are re-usable VueJs components based on vuetify.

