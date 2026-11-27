---
title: bexio invoices for readers without a street
lead: A reader whose address has no street, only "Street 2" (a P.O. box, say), is now synced to bexio and gets their invoices there again.
actionRequired: false
---

bexio refuses an address without a street. Until now, such a reader made the nightly bexio contact sync fail, and so did every invoice created for them, because the contact is updated with each invoice. We.Publish now sends their "Street 2" as the street to bexio.
