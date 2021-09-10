# Email Templates

## Getting Started
We.Publish can render html templates for sending emails. We.Publish uses [Email-Templates](https://email-templates.js.org/#/) and the template engine [pug](https://pugjs.org).

## Email Types
* LoginLink - Mail to users with a link that automatically authenticates the user
* PasswordReset - Same as LoginLink
* NewMemberSubscription - Mail to new users after they subscribed 
* RenewedMemberSubscription - Mail to users after they renewed their subscription
* MemberSubscriptionOffSessionBefore - Mail to users a week before credit card will be charged
* MemberSubscriptionOnSessionBefore - Mail to users a week before their payment is due
* MemberSubscriptionOnSessionAfter - Mail to user after the payment is due

## Templates
When creating an instance of `WepublishServer` you can pass an object called `mailContextOptions`. It has the following properties:
* `defaultFromAddress`: Default From address of the emails
* `defaultReplyToAddress`: Default Reply-to address of the emails
* `mailTemplateMaps`: List of email templates

`mailTemplateMaps` expects an array with template objects. The objects have the following structure:
```typescript
interface MailTemplateMap {
  type: SendMailType
  subject?: string
  fromAddress?: string
  replyToAddress?: string
  local: boolean
  localTemplate?: string
  remoteTemplate?: string
}
```

When creating templates you need to decide if you want to render the templates yourself or if the mail provider is handling/hosting the templates.

### Remote Templates
If the mail provider (mailgun / mailchimp) is handling the template you only need to set `type`, `subject`, `remoteTemplate` and `local`. The object could look like:
```javascript
const mailTemplate = {
  type: SendMailType.LoginLink,
  subject: 'New Login Link',
  remoteTemplate: 'loginLinkTemplate',
  local: false
}
```

### Local Templates
If We.Publish should render the templates you need to set a few more options.
```javascript
const mailTemplate = {
  type: SendMailType.LoginLink,
  localTemplate: 'loginLink', // Path to local template realtive from where you started the API. 
  local: true
}
```
