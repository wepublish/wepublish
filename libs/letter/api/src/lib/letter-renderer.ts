import { enrichTemplateData, renderTemplate } from '@wepublish/template/api';
import { countryName } from './letter-recipient';
import {
  LetterAddress,
  LetterAddressPosition,
} from './letter-provider/letter-provider.interface';

export interface LetterTemplateContent {
  htmlContent: string;
}

export interface ComposeLetterProps {
  template: LetterTemplateContent;
  data: Record<string, any>;
  recipient: LetterAddress;
  addressPosition: LetterAddressPosition;
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

const CONTENT_TOP_MM = FRANKING_ZONE_BOTTOM_MM + 2.5 - SHEET_PADDING_MM;

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

export function composeLetter({
  template,
  data,
  recipient,
  addressPosition,
}: ComposeLetterProps): string {
  const body = extractLetterBody(
    renderTemplate(template.htmlContent, enrichTemplateData(data))
  );

  const windowLeft =
    addressPosition === 'right' ?
      ADDRESS_WINDOW_RIGHT_MM
    : ADDRESS_WINDOW_LEFT_MM;

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
    padding: ${SHEET_PADDING_MM}mm;
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
    padding-top: ${CONTENT_TOP_MM}mm;
  }
</style>
</head>
<body>
<div class="sheet">
  <div class="address-window">
    ${formatAddressLines(recipient)
      .map(line => `<div>${escapeHtml(line)}</div>`)
      .join('\n    ')}
  </div>
  <div class="content">${body}</div>
</div>
</body>
</html>`;
}
