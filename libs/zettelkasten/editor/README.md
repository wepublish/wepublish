# zettelkasten-editor

The knowledge provider (Zettelkasten) in the article editor.

- `ZettelkastenPanel` is the side panel: a search over the dossiers, the fact
  anchors of the open article as suggested searches, every hit with its
  evidence path, and a dossier page in full. It never writes into the article;
  the writer reads and decides.
- `extractFactAnchors(texts)` finds capitalised word pairs in order, once
  each, without a model. `richtextToText(doc)` flattens a tiptap document.
- `pageIdFromEvidence(beleg)` turns the evidence path of a hit into the page
  id `wiki_seite` expects.

The article editor shows the panel and the `/fact` slash command only while
`zettelkastenEnabled` is true; the command is contributed through
`RichtextCommandItemsContext` of `@wepublish/richtext/editor`.

```bash
npx vitest run --config libs/zettelkasten/editor/vitest.config.ts
```
