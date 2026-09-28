import { theme } from './theme';

/**
 * The stylesheet shipped in the email's `<head>`. Its own module so the editor
 * canvas can use it without importing the `<html>` shell.
 */
export const EMAIL_CSS = `
  p, a, li, td, blockquote { mso-line-height-rule: exactly; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }
  table { border-collapse: collapse; }
  td, p, a { word-break: break-word; }
  h1, h2, h3, h4 { display: block; margin: 0; padding: 0; }
  .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div { line-height: 100%; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; }

  @media only screen and (max-width: ${theme.mobileBreakpoint}px) {
    .nl-container { width: 100% !important; max-width: 100% !important; }
    .nl-col { display: block !important; width: 100% !important; padding-left: 0 !important; }
    .nl-pad { padding-left: 16px !important; padding-right: 16px !important; }
    .nl-image { width: 100% !important; max-width: 100% !important; height: auto !important; }
  }
`;
