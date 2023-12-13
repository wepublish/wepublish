# Email Templates

We.Publish sends emails using remote templates. The templates can be configured
on the platform of the mail provider. See the provider's documentation for more
information:

* Mandrill: https://mailchimp.com/developer/transactional/docs/templates-dynamic-content
* Mailgun: https://www.mailgun.com/resources/tools/email-templates/

Media can modify the templates in a WYSIWYG editor.

The available templates can then be synchronized to the WePublish instance,
which allows them to be selected in the different settings pages that configure
the communication flows with the users.


Use the mailContext#sendMail() or mailContext#sendRemoteTemplateDirect()
methods to send an email. The former stores an entry in the mail log table, the
latter doesn't.
