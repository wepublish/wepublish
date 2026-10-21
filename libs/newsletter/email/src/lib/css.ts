/**
 * The stylesheet that ships inside the email's `<head>`.
 *
 * Its own module so the editor can drop it into the Puck canvas and get a
 * genuinely accurate preview, without the browser bundle having to import
 * `document.tsx` — the canvas draws blocks, not a whole `<html>` document.
 */
import { theme } from './theme';

export const EMAIL_CSS = `
  /* Word measures line height in points unless told otherwise. */
  p, a, li, td, blockquote { mso-line-height-rule: exactly; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }
  table { border-collapse: collapse; }
  td, p, a { word-break: break-word; }
  h1, h2, h3, h4 { display: block; margin: 0; padding: 0; }
  /* Outlook.com wraps the message in .ExternalClass and forces its own leading. */
  .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div { line-height: 100%; }
  /* Stop iOS turning dates and numbers into blue links. */
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; }

  @media only screen and (max-width: ${theme.mobileBreakpoint}px) {
    .nl-container { width: 100% !important; max-width: 100% !important; }
    /* The 4/8 teaser split collapses to two stacked rows. */
    .nl-col { display: block !important; width: 100% !important; padding-left: 0 !important; }
    .nl-pad { padding-left: 16px !important; padding-right: 16px !important; }
    .nl-image { width: 100% !important; max-width: 100% !important; height: auto !important; }
  }
`;
