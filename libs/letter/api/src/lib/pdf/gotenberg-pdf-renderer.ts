import { BasePdfRenderer, PdfRendererProps } from './base-pdf-renderer';
import { PdfRendererError } from './pdf-renderer';

export interface GotenbergPdfRendererProps extends PdfRendererProps {
  fallback?: {
    url?: string;
    username?: string;
    password?: string;
  };
}

const DEFAULT_TIMEOUT_MS = 60000;

/**
 * Renders through a self-hosted Gotenberg instance (its chromium html route),
 * so the html never leaves our own infrastructure. As with Cloudflare, the
 * print sheet declares its own `@page` size and margins.
 *
 * Basic auth is optional: it is only sent when both a username and a password
 * are configured, matching Gotenberg's `--api-enable-basic-auth`.
 */
export class GotenbergPdfRenderer extends BasePdfRenderer {
  private readonly fallback: NonNullable<GotenbergPdfRendererProps['fallback']>;

  constructor(props: GotenbergPdfRendererProps) {
    super(props);
    this.fallback = props.fallback ?? {};
  }

  async render(html: string): Promise<Buffer> {
    const config = await this.getConfig();
    const url = config?.gotenberg_url || this.fallback.url;
    const username = config?.gotenberg_username || this.fallback.username;
    const password = config?.gotenberg_password || this.fallback.password;
    const timeoutMs = config?.timeoutMs || DEFAULT_TIMEOUT_MS;

    if (!url) {
      throw new PdfRendererError(
        `No Gotenberg url configured for pdf renderer ${this.id}`
      );
    }

    const form = new FormData();
    form.append('files', new Blob([html], { type: 'text/html' }), 'index.html');
    form.append('printBackground', 'true');
    form.append('preferCssPageSize', 'true');

    return this.fetchPdf(
      `${url.replace(/\/+$/, '')}/forms/chromium/convert/html`,
      {
        method: 'POST',
        headers:
          username && password ?
            {
              Authorization: `Basic ${Buffer.from(
                `${username}:${password}`
              ).toString('base64')}`,
            }
          : {},
        body: form,
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
  }
}
