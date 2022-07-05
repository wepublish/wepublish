








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


## packages/editor
### How to call an api endpoint from the UI (.tsx file)?
Prerequisite: In the API (packages/api) exists a corresponding GraphQL endpoint.

1) In `editor/src/client/api` you have to create a corresponding graphql file or define your mutation or query in an existing one.
2) Start the API (`yarn watch`)
3) Navigate in your terminal to `packages/editor` and run `yarn generate:api`
4) Now the file `index.ts` will be generated automatically `in editor/src/client/api`
5) Now you can import your desired endpoint in your .tsx file. See for example `subscriptionEditPanel.tsx`

### Form validation
Validation is based on rsuite validation: https://rsuitejs.com/components/form-validation/

Validation takes a schema which defines the content type and requirements necessary to specific fields. In the example below, the form to register a new user takes:
* a name of type string, the name is required, 
* an email address of type string, which is also required and needs to be a valid email address


````
const userValidationModel = Schema.Model({
  name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
  email: StringType()
    .isRequired(t('errorMessages.noEmailErrorMessage'))
    .isEmail(t('errorMessages.invalidEmailErrorMessage')),
  password: validatePassword
})
````

All validation types are listed on the schema type [here](https://github.com/rsuite/schema-typed#table-of-contents).

Error messages are by default defined by rsuite but can be customized. In this example, they are customized in all 3 languages wePublish uses.


The model then needs to be specified in the related `<Form>` and the name of the field needs to be specified in the related `<FormControl>` as follow 

````
<Form
  model={validationModel}
  onSubmit={validationPassed => validationPassed && handleSave()}
  formValue={{name: name, email: email, password: password}}>

  <FormControl 
    name="name"
    />
  ...
</Form>
````
The validation will be triggered `onSubmit`. The `handleSave()` function will be triggered only if validation is successful. 
This part differs from the Rsuite documentation, where validation is checked with an if statement, which is less clean. 

For validation to be triggered on `onSubmit`, the form button needs to be of type `submit` and needs to be inside the form: 

````
<Form>
  ...
  <Button type = "submit"/>
</Form>
````

Finally, the `<Form>` needs to retrieve the values of the to-be-validated fields through `formValue`. This will allow the validation to run correctly when the fields are pre-filled as well. 

Validation only runs on type `<Form>`. Inputs of other types, like `SelectPicker` or other input types need to be turned into a form with the prop `accepter={SelectPicker}`.


## packages/api
### Environment Variables
- MAX_AUTO_RENEW_SUBSCRIPTION_BATCH: Maximal amount of subscriptions which are going to be auto-renewed. If any other value than number is set, no batch maxima are considered. Possible types: `number`, any other type is being ignored.
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

