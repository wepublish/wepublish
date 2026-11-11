---
title: Bexio contacts stay in sync
lead: Switch on the nightly contact sync in the Bexio integration, and every change to a reader's name, company, email or address reaches their Bexio contact the following night. Readers paying through Bexio who have no contact yet get one.
actionRequired: false
---

**What changes** (Bexio as payment provider; off until you switch it on)

- **Nightly push:** in Integrations → Payment providers → Bexio, tick "Sync contacts to Bexio nightly". From then on, readers whose data changed since the last push are updated in Bexio every night, and readers on a Bexio payment method without a contact get one created. The first night pushes everyone Bexio already knows once.
- **What is sent:** name or company, first name, email, street, house number, address line 2, postcode, city and country. The country is matched by its code, so a German address gets Germany instead of the integration's default country.
- **What stays as it is in Bexio:** contact groups, phone numbers, the second email and everything else on the contact. The same applies to the contact update Bexio gets with every invoice.
- **Status:** the tooltip of the switch shows when the sync last ran and the first error of that run, if any. A contact Bexio no longer knows is skipped and logged rather than created twice.
