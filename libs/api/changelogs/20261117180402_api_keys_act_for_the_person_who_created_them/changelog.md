---
title: API keys act for the person who created them
lead: An API key can now only do what the person who created it may do right now, and everything it does names both the key and that person. Check your API keys once after this update.
actionRequired: true
---

An API key is used by programs that work with your instance, such as an import, a cash register or an external app. From now on the person who created a key answers for it:

- **Checked on every use.** A key can only do what its creator is still allowed to do. If the creator loses a permission, the key loses it too; if the creator is deactivated, deleted or may no longer create API keys, the key stops working.
- **Recorded with key and person.** The **Audit log** shows actions made with a key as «API key: name · email of the creator». Where the editor shows who did something, for example in the delivery mode history and in the **Print issues**, it now adds «via API key "name"».

The **API Keys** list shows what that means for each key:

- **Blocked**: the creator no longer exists, is deactivated or may no longer create API keys. Hover over the label to see why. Programs using this key are refused.
- **n permissions missing**: the creator no longer holds some of the key's permissions. Hover over the label to see which; the key still works for the rest.

The list can now also be sorted by status, number of permissions, owner, last use and expiry. A key whose creator was deleted shows «Deleted user» as its owner.

**What to do:** open **API Keys** once and look for keys marked **Blocked** or with missing permissions. If a program still needs such a key, have someone with the right permissions create a new one and put it into the program.
