export const MAIL_BODY_MARKER = 'mail-body';

/**
 * Wraps body content in a table-based, responsive (max-width 600px) email shell
 * using only constructs broadly supported by mail clients. The body cell is the
 * editable region in the visual editor.
 */
export const wrapInEmailShell = (body: string): string => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f4f4f4;">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:8px;">
<tr>
<td class="${MAIL_BODY_MARKER}" style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#222222;word-break:break-word;overflow-wrap:break-word;">
${body}
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

/**
 * Returns an empty email document used when creating a new template.
 */
export const createEmptyEmailHtml = (): string =>
  wrapInEmailShell('<p style="margin:0 0 16px 0;"><br /></p>');
