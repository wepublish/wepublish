---
title: Invoices on paper for readers without a working email
lead: Readers on the letter channel now receive their renewal invoice printed from bexio, together with the invoice letter. Payments made in bexio are picked up every night, so a paid renewal extends the subscription by itself.
actionRequired: false
---

**What changes** (with bexio as payment provider; the printed part needs the paper-letter flow for your medium)

- **Invoice letters:** for a reader on the letter channel with a Swiss address, the renewal invoice is issued in bexio without an email, and its PDF, payment slip included, is printed after the "Invoice created" letter. To use this, switch on "Also by letter" for the "Invoice creation" event in the subscription flow, and keep "Mark Invoice as Open" switched on in the bexio integration.
- **Payments:** every renewal invoice bexio creates is kept as a payment in We.Publish. The nightly check marks it paid as soon as it is paid in bexio, extends the subscription and sends the renewal-success message. Nobody has to mark these invoices paid by hand. Deactivating a subscription also cancels its open bexio invoice.
- **Missing letters are caught up:** every night, open invoices of readers on the letter channel without a successful letter are posted, whether the print vendor refused the letter, the PDF was not available, or the reader was moved to letters after the invoice had gone out by email. After three refusals the invoice is left for you to look at.
- **Renewing in the editor** (optional, switched on per medium by We.Publish): "Renew" and "Reactivate" on a subscription then create the invoice in bexio and send the invoice message or letter right away, as the nightly run does.
