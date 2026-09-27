# User-facing changelogs

This folder is the source of truth for the user-facing changelog shown in the editor.
It works like `libs/api/prisma/migrations`: every branch/PR that changes something an
editor user can notice adds **one folder** here, and after `prisma migrate deploy`
the sync (`libs/changelog/api/src/lib/sync/run-sync-changelogs.ts`) copies every
entry into the instance's `changelog.entries` database table. Entries are keyed by
the unique folder name, so branches can be merged and deployed in **any order** —
an entry is inserted as soon as its folder reaches the deployed code, and never twice.

## Adding an entry

0. Or let Claude write it for you — requires only an installed Claude Code with
   a normal claude.ai login (no API key):

   ```bash
   npm run changelog:generate            # analyzes the branch diff vs origin/master
   npm run changelog:generate -- --base <git-ref>
   ```

   This drafts the entry in all three languages (en/de/fr), validates it with
   the same parser the sync uses, and tells you when the branch has nothing
   user-facing to announce. Review the wording before committing.

1. Or scaffold it manually (mirrors `prisma migrate dev --name …`):

   ```bash
   npm run changelog:create -- "New landing page block"
   # needs a manual step in every instance?
   npm run changelog:create -- "New landing page block" --action-required
   ```

   This creates a correctly named folder `<YYYYMMDDHHMMSS>_<snake_case_name>`
   (UTC timestamp — it becomes the entry's release date used for ordering; the
   folder name must match `^\d{14}_[a-z0-9_]+$`) with a `changelog.md` template
   whose structure is already valid for the sync. **Replace the TODO
   placeholders** — CI rejects entries that still contain `TODO`.

2. The `changelog.md` looks like this (the file name is always `changelog.md`):

   ```markdown
   ---
   title: Short, human-friendly title
   lead: One or two plain-language sentences about what changed for the user.
   actionRequired: false
   ---

   Optional longer description in markdown: paragraphs, [links](https://wepublish.ch),
   lists and images. Local images are referenced relatively and live next to this
   file: ![Screenshot](./screenshot.png)
   ```

3. Frontmatter rules: `title` and `lead` are required single-line values;
   `actionRequired` is optional and defaults to `false`. No other keys are allowed.
4. Images: put them in the entry's folder. During sync they are inlined into the
   stored description as data URIs, so keep them small (screenshots, not photos).
   Supported: png, jpg, jpeg, gif, webp, svg.

## Translations (de, en, fr)

`changelog.md` is the default content and the fallback. To translate an entry,
add `changelog.de.md`, `changelog.en.md` and/or `changelog.fr.md` next to it,
each with its own `title`/`lead` frontmatter and body (images work the same
way). The editor requests entries in the user's UI language and falls back to
the default content when no translation exists. Rules:

- Only `de`, `en` and `fr` are allowed as locale suffixes — anything else fails
  the sync (and CI).
- `actionRequired` belongs in the base `changelog.md` only; it is ignored in
  translation files.

## `actionRequired: true`

Use this when the change needs a manual step in every instance (e.g. "add the new
block to your navigation"). Such entries are shown prominently on the editor
dashboard until a logged-in user confirms that the action has been completed;
the confirmation (who + when) is stored per instance.

Write for end users (editors, not developers): say what changed and what to do,
not how it was implemented.

## Guarantees

- The sync is idempotent: it inserts missing entries and updates entries whose
  content changed (fixing a typo is fine), but it **never** resets an existing
  confirmation.
- `libs/changelog/api/src/lib/sync/repo-changelogs.spec.ts` validates every entry
  in this folder in CI, so a malformed entry fails the build instead of the
  production migration job.
- Changelog data is private per instance — the GraphQL queries require an
  authenticated editor session.
