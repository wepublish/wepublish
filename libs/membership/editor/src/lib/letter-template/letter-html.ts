import { MAIL_BODY_MARKER } from '../mail-template/mail-html';

/**
 * The editable shell for a letter. It carries the same marker the visual editor
 * looks for, but none of the email chrome: what is authored here is printed on
 * A4, so there is no card, no grey backdrop and no 600px column. The page
 * furniture (address window, margins, QR bill slot) is added by the api when the
 * pdf is rendered, and only the content of `<body>` is taken over.
 */
export const wrapInLetterShell = (body: string): string => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<div class="${MAIL_BODY_MARKER}" style="font-family:Helvetica,Arial,sans-serif;font-size:11pt;line-height:1.45;color:#000000;">
${body}
</div>
</body>
</html>`;

export const createEmptyLetterHtml = (): string =>
  wrapInLetterShell('<p style="margin:0 0 12px 0;"><br /></p>');
