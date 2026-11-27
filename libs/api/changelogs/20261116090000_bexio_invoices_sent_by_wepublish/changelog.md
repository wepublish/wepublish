---
title: We.Publish can send the Bexio invoices
lead: Bexio only issues renewal invoices, and We.Publish sends the Bexio PDF with the «invoice created» mail or letter.
actionRequired: false
---

The Bexio payment integration has a new setting, «We.Publish sends the Bexio
invoices». When it is on, Bexio no longer emails renewal invoices itself. It
issues them, and We.Publish attaches the Bexio PDF to the «invoice created»
mail of the subscription flow, or prints it after the letter for readers who
receive letters. Readers get one mail instead of two, with your template's
wording, and the mail log shows whether it was delivered.

If Bexio cannot provide the PDF that night, the mail is held back, the mail
log shows why, and the mail goes out on a following night once the PDF is
available.

Before switching it on, check the text of your «invoice created» template: it
should no longer mention a separate mail from Bexio. Bexio shows no email
history for invoices sent this way. Invoices from the checkout are still sent
by Bexio.
