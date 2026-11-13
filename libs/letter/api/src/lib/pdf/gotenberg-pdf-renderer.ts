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
 * so the html never leaves our own infrastructure. Office documents, such as
 * the Word files attached to mail templates, go through its LibreOffice route. As with Cloudflare, the
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

  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();

    return !!(config?.gotenberg_url || this.fallback.url);
  }

  canConvertDocuments(): Promise<boolean> {
    return this.isConfigured();
  }

  async render(html: string): Promise<Buffer> {
    const form = new FormData();
    form.append('files', new Blob([html], { type: 'text/html' }), 'index.html');
    form.append('printBackground', 'true');
    form.append('preferCssPageSize', 'true');

    return this.post('/forms/chromium/convert/html', form);
  }

  /**
   * Converts through Gotenberg's LibreOffice route, which keeps the page size
   * and margins the document itself sets.
   */
  async convertDocument(file: Uint8Array, filename: string): Promise<Buffer> {
    const form = new FormData();
    // Copied into a plain ArrayBuffer: a Buffer may be a view into node's
    // shared pool, which Blob would take whole.
    form.append('files', new Blob([new Uint8Array(file)]), filename);

    return this.post('/forms/libreoffice/convert', form);
  }

  private async post(route: string, form: FormData): Promise<Buffer> {
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

    return this.fetchPdf(`${url.replace(/\/+$/, '')}${route}`, {
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
    });
  }
}
