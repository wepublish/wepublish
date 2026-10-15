import { enrichTemplateData, renderTemplate } from '@wepublish/template/api';
import { countryName } from './letter-recipient';
import {
  LetterAddress,
  LetterAddressPosition,
} from './letter-provider/letter-provider.interface';

export interface LetterTemplateContent {
  htmlContent: string;
  /** Uploaded pdf (e.g. a static QR-bill) printed after the letter pages. */
  letterAppendixId?: string | null;
}

/**
 * Stationery: a header and a footer printed on every page, each in a band of
 * the given height measured from the sheet edge.
 */
export interface LetterLayoutContent {
  headerHtml: string;
  footerHtml: string;
  headerHeightMm: number;
  footerHeightMm: number;
}

export interface ComposeLetterProps {
  template: LetterTemplateContent;
  data: Record<string, any>;
  recipient: LetterAddress;
  addressPosition: LetterAddressPosition;
  layout?: LetterLayoutContent | null;
}

/**
 * The coordinates pingen reserves on an A4 sheet. The address has to sit inside
 * the address zone, and the franking zone around it has to stay free of
 * anything else, or the letter is rejected on upload. The address zone is
 * inset by 2mm from the franking zone that surrounds it, which is where these
 * two lefts come from: the franking zone starts at 20mm and at 116mm.
 */
const ADDRESS_WINDOW_LEFT_MM = 22;

const ADDRESS_WINDOW_RIGHT_MM = 118;

const ADDRESS_WINDOW_TOP_MM = 60;

const ADDRESS_WINDOW_WIDTH_MM = 85.5;

const ADDRESS_WINDOW_HEIGHT_MM = 25.5;

const FRANKING_ZONE_BOTTOM_MM = 87.5;

const SHEET_PADDING_MM = 20;

/** Where the first line of the body sits on page one, from the sheet top. */
const CONTENT_TOP_MM = FRANKING_ZONE_BOTTOM_MM + 2.5;

/**
 * The tallest band a header or footer may take. The franking zone pingen
 * keeps free around the address window starts well below 40mm for either
 * window position, so a header within that band can never reach into it.
 */
export const LAYOUT_BAND_MAX_MM = 40;

/** Breathing space between a band and the text flowing past it. */
const BAND_GAP_MM = 5;

export function clampBandHeight(heightMm: number): number {
  if (!Number.isFinite(heightMm) || heightMm < 0) {
    return 0;
  }

  return Math.min(heightMm, LAYOUT_BAND_MAX_MM);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const BODY_REGEX = /<body[^>]*>([\s\S]*)<\/body>/i;

/**
 * Templates are authored as a whole html document, like mail templates are. A
 * document cannot be nested inside the print sheet, so only what the author
 * actually wrote is taken over.
 */
export function extractLetterBody(html: string): string {
  const match = BODY_REGEX.exec(html);

  return (match ? match[1] : html).trim();
}

export function formatAddressLines(address: LetterAddress): string[] {
  const street = [address.street, address.number].filter(Boolean).join(' ');

  return [
    address.name,
    address.pobox ?? '',
    street,
    `${address.zip} ${address.city}`,
    countryName(address.country),
  ].filter(line => line.trim().length > 0);
}

/**
 * A band of stationery. Fixed, so the print engine repeats it on every page;
 * the flowing text keeps clear of it through the spacers in the table's head
 * and foot, which are repeated per page as well.
 */
function bandCss(
  className: string,
  edge: 'top' | 'bottom',
  heightMm: number
): string {
  return `
  .${className} {
    position: fixed;
    ${edge}: 0;
    left: 0;
    right: 0;
    height: ${heightMm}mm;
    box-sizing: border-box;
    padding: 0 ${SHEET_PADDING_MM}mm;
    overflow: hidden;
  }`;
}

export function composeLetter({
  template,
  data,
  recipient,
  addressPosition,
  layout,
}: ComposeLetterProps): string {
  const enriched = enrichTemplateData(data);
  const render = (html: string) =>
    extractLetterBody(renderTemplate(html, enriched));
  const body = render(template.htmlContent);

  const windowLeft =
    addressPosition === 'right' ?
      ADDRESS_WINDOW_RIGHT_MM
    : ADDRESS_WINDOW_LEFT_MM;

  const headerHeight = layout ? clampBandHeight(layout.headerHeightMm) : 0;
  const footerHeight = layout ? clampBandHeight(layout.footerHeightMm) : 0;
  // A band of zero height needs no gap either.
  const headerSpace = headerHeight ? headerHeight + BAND_GAP_MM : 0;
  const footerSpace = footerHeight ? footerHeight + BAND_GAP_MM : 0;
  const header = layout && headerHeight ? render(layout.headerHtml) : null;
  const footer = layout && footerHeight ? render(layout.footerHtml) : null;

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 0;
  }
  html, body {
    margin: 0;
    padding: 0;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #000;
    background: #fff;
  }
  .sheet {
    position: relative;
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    padding: 0 ${SHEET_PADDING_MM}mm;
  }
  .flow {
    width: 100%;
    border-collapse: collapse;
  }
  .flow td {
    padding: 0;
    vertical-align: top;
  }${header === null ? '' : bandCss('letter-header', 'top', headerHeight)}${
    footer === null ? '' : bandCss('letter-footer', 'bottom', footerHeight)
  }
  .address-window {
    position: absolute;
    top: ${ADDRESS_WINDOW_TOP_MM}mm;
    left: ${windowLeft}mm;
    width: ${ADDRESS_WINDOW_WIDTH_MM}mm;
    height: ${ADDRESS_WINDOW_HEIGHT_MM}mm;
    overflow: hidden;
    font-size: 11pt;
    /* Five address lines still have to fit into the zone's height. */
    line-height: 1.25;
  }
  .content {
    /* The header spacer already pushes the first page down by its share. */
    padding-top: ${CONTENT_TOP_MM - headerSpace}mm;
  }
</style>
</head>
<body>
${header === null ? '' : `<div class="letter-header">${header}</div>\n`}${
    footer === null ? '' : `<div class="letter-footer">${footer}</div>\n`
  }<div class="sheet">
  <div class="address-window">
    ${formatAddressLines(recipient)
      .map(line => `<div>${escapeHtml(line)}</div>`)
      .join('\n    ')}
  </div>
  <table class="flow">
    <thead><tr><td style="height: ${headerSpace}mm"></td></tr></thead>
    <tfoot><tr><td style="height: ${footerSpace}mm"></td></tr></tfoot>
    <tbody><tr><td><div class="content">${body}</div></td></tr></tbody>
  </table>
</div>
</body>
</html>`;
}
