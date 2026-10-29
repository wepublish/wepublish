---
title: The editor now asks before an action emails a member
lead: Four actions in the editor can send an email to a member. Before each of them, the editor now asks whether that email goes out — or tells you that none will, and why.
actionRequired: false
---

**Where the dialog appears:**

- **Create a subscription** — Subscriptions → new subscription → “Create” or “Create & Close”. Email: “Subscription started”.
- **Cancel a subscription** — Subscriptions → a subscription → “Deactivate”, then confirm in the dialog. Email: “Subscription cancelled”, or “Deactivation for unpaid invoice” if you choose that reason.
- **Create a user** — Users → new user → “Save” or “Save & Close”. Email: “Registration”.
- **Mark an invoice as paid** — Subscriptions → a subscription → invoice history → “Pay manually”, then confirm. Email: “Renewal successful” (payment confirmation).

**What the dialog shows:**

- If an email would go out, you see its template and the member's email address. **“Don't send”** is preselected: Enter runs the action without the email, **“Send”** sends it.
- If no email would go out, the dialog says why — no template is assigned under “Automatic emails”, or, for invoices, it is the first period of a subscription or the confirmation was already sent or suppressed. **OK** (also Enter) runs the action.
- **Esc** cancels the action: nothing is saved.

Note: until now these emails went out without asking. With Enter, they are no longer sent.
