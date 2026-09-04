# migrate-article-authors

Migrates "composite" authors such as `Jana Schmid (Text) und Simon Boschi (Bild)` to the
new per-article author structure: one author per person, with the role (`Text`, `Bild`,
…) stored on the article revision author.

The tool only talks to the GraphQL API. It does not need database access.

## What it does

1. **Parses every author name** into persons and roles.
   - `Jürg Steiner (Text), Simon Boschi (Bilder)` → Jürg Steiner [Text], Simon Boschi [Bilder]
   - `Joël Widmer, Jürg Steiner (Text) und Jana Leu (Bilder)` → Joël Widmer (no role), Jürg Steiner [Text], Jana Leu [Bilder];
     a role applies only to the person directly before the parentheses
   - `von Jürg Steiner`, `Jürg Steiner  `, `Jürg Steiner(Text)`, `… (Bilder` (missing paren) are normalised
   - names containing `und` inside a hyphenated compound (`Stadt- und Landschaftsentwicklung`) are kept whole
   - a hand-maintained `OVERRIDES` table covers names that cannot be parsed (`… aufgezeichnet von …`,
     `Valeria Heintges, Frida-Magazin`, …) and `ALIASES` fixes obvious typos (`Danielle Linger` → `Danielle Liniger`)
   - everything in parentheses becomes the role verbatim, including affiliations like `(Bajour)`. The
     Hauptstadt front end renders `Name (role)`, so the display stays identical.
2. **Picks one canonical author per person** (prefers the plain-name author, then the one with
   image / bio / job title / links, then the most used one). Duplicates (two `Jürg Steiner`
   authors), role variants (`Simon Boschi (Bilder)`) and composites are mapped onto it.
   If the canonical author still carries a role or whitespace in its name it is renamed
   (and its slug fixed when the target slug is free). Missing links/bio/image/job title are
   copied from the merged variants. Persons that only exist inside composites are created.
3. **Rewrites every affected article revision** (published and draft) with the mapped
   authors and roles. Social media authors are mapped too (without roles).
   - published revision: a new revision with identical content is created and published at the
     original `publishedAt`; the article date does not change
   - an existing draft is re-created on top afterwards, so unpublished work is kept
   - articles with a pending (scheduled) revision and peered articles are skipped and listed
   - after every write the new revision is fetched again and compared field by field
     (blocks, properties, metadata, authors). On any mismatch the run stops.
4. **Deletes the merged authors** (`cleanup`) once no published/draft revision references them.
   Note: deleting an author also removes it from archived (historic) revisions.

Blocks are round-tripped generically: the selection set and the output → input conversion are
derived from `apps/api-example/schema-v2.graphql`, so every block type the API knows is covered
(including nested flex blocks and teasers). Block types without an input type (`UnknownBlock`)
make the article fail loudly instead of losing content.

## Usage

Everything runs from the repository root with `npx tsx`.

```sh
# credentials: either an API token (Editor → Settings → Tokens; role must allow
# reading/creating/publishing articles and managing authors) …
export WEPUBLISH_TOKEN=...
# … or an editor login
export WEPUBLISH_EMAIL=... WEPUBLISH_PASSWORD=...

# optional – defaults to https://api-hauptstadt.wepublish.cloud/v1
export WEPUBLISH_API_URL=https://api-hauptstadt.wepublish.cloud/v1

# 1. analyse and write the plan (read only; works before the API change is deployed)
#    writes plan.json (machine readable, used by apply) and plan.html (report)
npx tsx tools/migrate-article-authors/src/main.ts analyze --out plan.json [--html report.html]

# 2. review plan.html / plan.json; adjust OVERRIDES and ALIASES in main.ts if needed, re-run analyze

# 3. dry run, then a single article, then everything
npx tsx tools/migrate-article-authors/src/main.ts apply --plan plan.json --dry-run
npx tsx tools/migrate-article-authors/src/main.ts apply --plan plan.json --only <article-slug>
npx tsx tools/migrate-article-authors/src/main.ts apply --plan plan.json

# 4. delete the merged authors
npx tsx tools/migrate-article-authors/src/main.ts cleanup --plan plan.json --dry-run
npx tsx tools/migrate-article-authors/src/main.ts cleanup --plan plan.json
```

### Output of `analyze`

- `plan.json` – everything `apply` needs, plus a `summary`, the author map, and for every affected
  article a `mappings` list per revision: which original author entry becomes which author(s)
  and role(s), e.g. `{name: "Jana Schmid (Text)", slug: "jana-schmid-text"}` →
  `[{name: "Jana Schmid", slug: "jana-schmid", role: "Text"}]`. The target side uses the
  names/slugs the authors will have after the migration; `slug: null` + `isNew` marks authors
  that still have to be created.
- `plan.html` – self-contained report: summary, roles, possible typos, skipped articles, and a
  filterable table of all article changes (hover an
  author to see its slug). Author-level details (merges, renames, authors to create/delete,
  parse warnings) are printed to the console and kept in `plan.json`.

Notes

- Run `analyze` **with credentials**: anonymously only published articles are visible, drafts
  are not analysed and the plan says so.
- `apply` refuses to run until the API exposes `ArticleRevisionAuthorInput` (the pending role
  change must be deployed first).
- Progress is appended to `<plan>.log.jsonl`. Re-running `apply`/`cleanup` skips finished
  items, so an interrupted run can simply be restarted.
- `apply` recomputes the new author list from the live article at run time (using the
  author map in the plan), so articles edited after `analyze` are still migrated correctly.
- Every migrated article gets one (published) or two (published + draft) new revisions.
  The previous revisions stay in the version history and can be restored from the editor.
