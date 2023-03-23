# Email Templates

## Getting Started
We.Publish can render html templates for sending emails. We.Publish uses [Email-Templates](https://email-templates.js.org/#/) and the template engine [pug](https://pugjs.org).

## Email Types
* LoginLink - Mail to users with a link that automatically authenticates the user
* PasswordReset - Same as LoginLink

## Templates
When creating an instance of `WepublishServer` you can pass an object called `mailContextOptions`. It has the following properties:
* `defaultFromAddress`: Default From address of the emails
* `defaultReplyToAddress`: Default Reply-to address of the emails

When creating templates you need to decide if you want to render the templates yourself or if the mail provider is handling/hosting the templates.
