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

- [Write Automated Tests](testing.md)
- [Setup Commenting](commenting.md)
- [Email Templates](emailtemplates.md)
- [Releases](Releases.md)

## apps/editor

### How to call an api endpoint from the UI (.tsx file)?

Prerequisite: In the API (packages/api) exists a corresponding GraphQL endpoint.

1. In `editor/src/app/api` you have to create a corresponding graphql file or define your mutation or query in an existing one.
2. Start the API (`npm run watch`)
3. In your terminal run `npx nx generate-api`
4. Now the file `index.ts` will be generated automatically in `apps/editor/src/app/api`
5. Now you can import your desired endpoint in your .tsx file. See for example `subscriptionEditPanel.tsx`

### Analytics

Please refer to the documentation
https://github.com/wepublish/analytics#readme

### Form validation

Validation is based on rsuite validation: https://rsuitejs.com/components/form-validation/

Validation takes a schema which defines the content type and requirements necessary to specific fields. In the example below, the form to register a new user takes:

- a name of type string, the name is required,
- an email address of type string, which is also required and needs to be a valid email address

```
const userValidationModel = Schema.Model({
  name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
  email: StringType()
    .isRequired(t('errorMessages.noEmailErrorMessage'))
    .isEmail(t('errorMessages.invalidEmailErrorMessage')),
  password: validatePassword
})
```

All validation types are listed on the schema type [here](https://github.com/rsuite/schema-typed#table-of-contents).

Error messages are by default defined by rsuite but can be customized. In this example, they are customized in all 3 languages wePublish uses.

The model then needs to be specified in the related `<Form>` and the name of the field needs to be specified in the related `<FormControl>` as follow

```
<Form
  model={validationModel}
  onSubmit={validationPassed => validationPassed && handleSave()}
  formValue={{name: name, email: email, password: password}}>

  <FormControl
    name="name"
    />
  ...
</Form>
```

The validation will be triggered `onSubmit`. The `handleSave()` function will be triggered only if validation is successful.
This part differs from the Rsuite documentation, where validation is checked with an if statement, which is less clean.

For validation to be triggered on `onSubmit`, the form button needs to be of type `submit` and needs to be inside the form:

```
<Form>
  ...
  <Button type = "submit"/>
</Form>
```

Finally, the `<Form>` needs to retrieve the values of the to-be-validated fields through `formValue`. This will allow the validation to run correctly when the fields are pre-filled as well.

Validation only runs on type `<Form>`. Inputs of other types, like `SelectPicker` or other input types need to be turned into a form with the prop `accepter={SelectPicker}`.

### Restricting Content With Permission Control

Permission control allows for restricting Editor content dependent on the current user's role.

`createCheckedPermissionComponent` takes a list of permission IDs, any of which would permit access, followed by the component that is being controlled.

```
const CheckedPermissionComponent = createCheckedPermissionComponent(listOfPermissions)(ControlledComponent)
```

The controlled component can then be exported to replace the uncontrolled version.

`export {CheckedPermissionComponent as ControlledComponent}`

If checks pass, and the user retains the specified permissions then the original component will be returned, otherwise the component will return an error message notifying the user that they aren't authorized to access that content.
It is possible to hide the component without the error message by passing false as a second argument to `createCheckedPermissionComponent()`.

To check whether a user retains an individual permission, the `authorise()` can be called.
This takes a permission ID and returns `true` or `false` depending on whether the current user has that permission.

`authorise(permissionID)`

### Form accessibility

To properly attach label to input, as well as utilize auto-generated `aria-labelledby` and `aria-describeby`, rsuite provides a `controlId` prop on `Form.Group`. This should be watched throughout the project to ensure the best possible performance and usability of the forms. More information can be found under this link: https://rsuitejs.com/components/form/#accessibility

### Custom HTML block

After requests from publishers and weighing benefits and potential issues, we decided to allow to save custom HTML blocks both in articles and pages. Allowing to save and display custom HTML blocks is risky due to the fact that these blocks can be used to run dangerous scripts on the client side that may lead to, e.g. account impersonation, observing user behaviour, loading external content or stealing sensitive data. But, as the blocks will be added by publishers themselves, it's their responsibility to make sure that the HTML blocks are secure. WePublish provides further measurements by applying a filter on the HTML that sanitises the publisher's input, minimising the risk of running malicious code.

To give further control over the content of HTML block, whitelisting certain tags and urls will be made possible in the editor's settings. In addition, we always store the original data in the database, and we allow the publisher to see the sanitised data in the settings to see how (and if) the HTML was changed thanks to the xss prevention filter - which can further help to understand the risks and dangers.

We have, however, to be aware that it's almost impossible to be 100% sure that none of the code displayed as custom HTML is dangerous.

### Icon Library

The icon library used throughout the editor is react-icons. https://react-icons.github.io/react-icons

It's a great library created reasonably long time ago, with a good support, that includes few of the most widely used icon packages, all for free.
For consistency, we decided to only use one of the icon sets in our project, and we chose material-icons from Google.

- it contains lots of icons
- it utilizes ES6 imports that allows us to include only the icons that we are using in our project
- it's free (Apache License 2.0)
- it's widely used
- it's supported by Google

The usage is very simple. In your component import the icon as a React component like this:

`import { IconName } from "react-icons/md";`

then just use the icon by rendering it as JSX like this:

`<IconName />`

Here is the complete list of icons by material-design that are supported by react-icons https://react-icons.github.io/react-icons/icons?name=md
For reasearch purposes, if you want to add a new icons but struggle to find it by name (e.g. trash), you can search under this link
https://fonts.google.com/icons as the search is a bit more intelligent than just looking on the string representing the icon's name. Here's an
example: https://fonts.google.com/icons?icon.query=trash

## libs/api

### Environment Variables

- MAX_AUTO_RENEW_SUBSCRIPTION_BATCH: Maximal amount of subscriptions which are going to be auto-renewed. If any other value than number is set, no batch maxima are considered. Possible types: `number`, any other type is being ignored.

### Subscriptions

#### Receiving webhooks from payment providers such as Stripe or Payrexx

The webhook will call `paymentProvider.updatePaymentWithIntentState()` which will create a payment.
This creates a payment creation event which is caught by `paymentProvider.setupPaymentProvider()`.
Within this event another invoice event will be triggered which is handled in `events.invoiceModelEvents()`
