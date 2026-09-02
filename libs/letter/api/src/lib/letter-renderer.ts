import { enrichTemplateData, renderTemplate } from '@wepublish/template/api';
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
  sender?: LetterAddress;
  addressPosition: LetterAddressPosition;
  qrBillSvg?: string;
}

const ADDRESS_WINDOW_LEFT_MM = 20;

const ADDRESS_WINDOW_RIGHT_MM = 120;

const ADDRESS_WINDOW_TOP_MM = 47;

const QR_BILL_HEIGHT_MM = 105;

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
    address.country,
  ].filter(line => line.trim().length > 0);
}

export function composeLetter({
  template,
  data,
  recipient,
  sender,
  addressPosition,
  qrBillSvg,
}: ComposeLetterProps): string {
  const body = extractLetterBody(
    renderTemplate(template.htmlContent, enrichTemplateData(data))
  );

  const windowLeft =
    addressPosition === 'right' ?
      ADDRESS_WINDOW_RIGHT_MM
    : ADDRESS_WINDOW_LEFT_MM;

  const senderLine = sender ? formatAddressLines(sender).join(', ') : undefined;

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
    padding: 20mm 20mm ${qrBillSvg ? QR_BILL_HEIGHT_MM + 10 : 20}mm 20mm;
  }
  .address-window {
    position: absolute;
    top: ${ADDRESS_WINDOW_TOP_MM}mm;
    left: ${windowLeft}mm;
    width: 85mm;
    height: 25mm;
    overflow: hidden;
    font-size: 11pt;
    line-height: 1.35;
  }
  .address-window .sender {
    font-size: 7pt;
    line-height: 1.2;
    padding-bottom: 1mm;
  }
  .content {
    padding-top: 55mm;
  }
  .qr-bill {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 210mm;
    height: ${QR_BILL_HEIGHT_MM}mm;
    page-break-inside: avoid;
  }
  .qr-bill svg {
    display: block;
    width: 210mm;
    height: ${QR_BILL_HEIGHT_MM}mm;
  }
</style>
</head>
<body>
<div class="sheet">
  <div class="address-window">
    ${senderLine ? `<div class="sender">${escapeHtml(senderLine)}</div>` : ''}
    ${formatAddressLines(recipient)
      .map(line => `<div>${escapeHtml(line)}</div>`)
      .join('\n    ')}
  </div>
  <div class="content">${body}</div>
  ${qrBillSvg ? `<div class="qr-bill">${qrBillSvg}</div>` : ''}
</div>
</body>
</html>`;
}
