/**
 * The sheet a stationery band is edited on. Mirrors how the letter renderer
 * prints a band (`composeLetter` in libs/letter/api/src/lib/letter-renderer.ts):
 * the full A4 width, the sheet's side padding, the letter's font. The editor
 * cannot import the api lib, so keep both in step.
 */
const SHEET_WIDTH_MM = 210;

const SHEET_PADDING_MM = 20;

/** Room below the band, so what the print would cut off stays in sight. */
const OVERFLOW_ROOM_MM = 15;

export const BAND_SELECTOR = '.letter-band';

/**
 * A whole document around the band's html. The printed band clips what
 * doesn't fit; here it stays visible below a marked edge instead, so an author
 * sees what would go missing.
 */
export function bandDocument(
  html: string,
  heightMm: number,
  cutOffLabel: string
): string {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }
  .letter-sheet {
    position: relative;
    width: ${SHEET_WIDTH_MM}mm;
    min-height: ${heightMm + OVERFLOW_ROOM_MM}mm;
    box-sizing: border-box;
    padding: 0 ${SHEET_PADDING_MM}mm;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #000;
  }
  .letter-band {
    min-height: ${heightMm}mm;
  }
  .letter-band-edge {
    position: absolute;
    top: ${heightMm}mm;
    left: 0;
    right: 0;
    border-top: 1px dashed #c62828;
    padding: 1mm ${SHEET_PADDING_MM}mm 0;
    font: 8pt Helvetica, Arial, sans-serif;
    color: #c62828;
    pointer-events: none;
    user-select: none;
  }
</style>
</head>
<body>
<div class="letter-sheet"><div class="letter-band">${html}</div><div class="letter-band-edge">${escapeText(
    cutOffLabel
  )}</div></div>
</body>
</html>`;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Strips what the editor or a browser extension put into the markup, so none
 * of it ends up in what is saved and printed.
 */
export function cleanEditorMarkup(root: Element) {
  root
    .querySelectorAll(
      'grammarly-desktop-integration, [data-grammarly-shadow-root]'
    )
    .forEach(el => el.remove());

  [root, ...Array.from(root.querySelectorAll('*'))].forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (
        /^data-(new-)?gr/i.test(attr.name) ||
        attr.name === 'spellcheck' ||
        attr.name === 'contenteditable'
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });
}

/** The band's html as it is stored: what's inside the band, nothing else. */
export function serializeBand(doc: Document): string {
  const band = doc.querySelector(BAND_SELECTOR);

  if (!band) {
    return '';
  }

  const clone = band.cloneNode(true) as Element;
  cleanEditorMarkup(clone);

  return clone.innerHTML;
}
