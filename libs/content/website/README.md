# content-website

This library was generated with [Nx](https://nx.dev).

## Unavailable articles and pages

An article or page without a visible version (never published, unpublished,
scheduled while `SHOW_PENDING_WHEN_NOT_PUBLISHED` is off) still answers 200: the
editor preview opens that very page with `?preview` and loads the draft in the
browser afterwards. `ContentUnavailable` (used by `Article` and `Page`) marks
the empty state `noindex` and tells visitors who cannot preview *Dieser Inhalt
ist nicht verfügbar*; with `?preview`, preview mode from the admin bar
(`PREVIEW_MODE` in session storage) or a login that may preview it renders the
unchanged `PreviewUnavailable` instead. The note appears only after hydration,
so the shared server html stays the same for everybody.

## Running unit tests

Run `nx test content-website` to execute the unit tests via Vitest.
