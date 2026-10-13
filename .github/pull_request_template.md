<!--
Thanks for the pull request. One thing is checked automatically and is worth
knowing about before you open it: the changelog.
-->

## What changes

<!-- One or two sentences. What does this do, and why now? -->

## Changelog

Every branch that changes something an editor user can notice adds one entry
under `libs/api/changelogs/`. It is picked up on deploy and shown to editors in
the notification centre.

- [ ] I added an entry — `npm run changelog:generate` drafts it from the branch
      diff in all three languages, `npm run changelog:create -- "Short title"`
      scaffolds one by hand. Use `--action-required` when every instance has to
      do something manually.
- [ ] Nothing user-facing changed — I labelled this pull request
      **`no-changelog`**.

Run `npm run changelog:check` locally to see what CI will say.

## Anything reviewers should know

<!-- Trade-offs you made, things you deliberately left out, parts you are unsure
     about. Delete if there is nothing. -->
