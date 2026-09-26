# newsletter

The block-based newsletter editor and its email renderer, ported from the
standalone ee-news.ch Cloudflare Worker (`eenews-nl`) into the CMS.

Three libraries:

| Library               | Alias                          | Purpose                                                                                                                                                 |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `libs/newsletter`     | `@wepublish/newsletter`        | Shared by API and editor: the block vocabulary and renderer (`blocks.tsx`, `@react-email/components`), document validation (`parse.ts`), merge tags, the size report. |
| `libs/newsletter/api` | `@wepublish/newsletter/api`    | NestJS module: Prisma CRUD, article/image resolution, HTML rendering, Mailchimp draft campaigns.                                                          |
| `libs/newsletter/editor` | `@wepublish/newsletter/editor` | Editor pages: the list and the Puck-based block editor with its custom fields.                                                                        |

## How it fits together

- A newsletter is a `Newsletter` row holding a title and a JSON `document`
  (`{ preheader, blocks[] }`), validated by `parseDocument` on every read and
  write. Blocks are plain data and never carry rendered HTML.
- A **teaser block stores an article id and nothing else**. Headline, kicker,
  lead, link and image are read from the CMS on every render
  (`NewsletterContentService`), so a correction on the site reaches an issue
  drafted before it. Image blocks store a CMS image id (or an external URL).
- The Puck canvas draws every block with the same `renderBlock` the mail uses,
  so it shows the newsletter's own markup, not an approximation.
- **Publishing** (`publishNewsletterToMailchimp`) renders the stored document
  and pushes it into a Mailchimp **draft** campaign, one per newsletter: the
  first publish creates the draft, later ones patch it. Nothing here ever
  sends or schedules a campaign.

## Mailchimp

The Marketing API key and audience come from the existing **Mailchimp sync
integration** (`SettingSyncProvider`, edited under Settings › Integrations);
there is no separate configuration. Exactly one enabled Mailchimp integration
is required to publish.

Behaviour observed against the live API, preserved in the code comments:

- Never give a generated campaign a `template_id` and never create one via
  `actions/replicate`: such a campaign renders from its template and silently
  discards uploaded HTML.
- Settings are patched **before** the HTML is uploaded, never after: a settings
  patch re-renders the campaign and throws the HTML away.
- Publishing refuses an issue whose rendered HTML lacks `*|UNSUB|*` or a postal
  address tag. Mailchimp accepts such a draft and refuses only at the send.
- Merge tags are literal text everywhere except the inbox.

## Images and Outlook

Outlook on Windows renders through Word, which cannot decode WebP, the format
the media server produces for every transformation. The API therefore requests
teaser and block images with `format: jpeg` (a media-server transformation
added for this purpose, `ImageOutputFormat` in GraphQL), sized at twice the
column they render in.

## Gmail clipping

Gmail clips a mail over 102 KB and what it cuts is the end, i.e. the footer
with the unsubscribe link. `newsletterPreview` returns the rendered HTML with
its UTF-8 size; the editor's «Checks» section warns from 80 %, because
Mailchimp's merge-tag expansion and link tracking make the sent mail larger
than the upload.

## Commands

```bash
nx typecheck newsletter newsletter-api newsletter-editor
nx test newsletter            # vitest
nx test newsletter-api        # jest (NestJS)
nx test newsletter-editor     # vitest
```

Adding a resolver field: boot the API once (non-production) so
`apps/api-example/schema-v2.graphql` is rewritten, adjust
`libs/editor/api/src/lib/schemas/newsletter.graphql`, then `npm run generate-api`.
