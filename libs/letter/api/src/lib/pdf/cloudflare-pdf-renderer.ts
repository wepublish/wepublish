import { BasePdfRenderer, PdfRendererProps } from './base-pdf-renderer';
import { PdfRendererError } from './pdf-renderer';

export interface CloudflarePdfRendererProps extends PdfRendererProps {
  fallback?: {
    accountId?: string;
    apiToken?: string;
  };
}

const DEFAULT_TIMEOUT_MS = 60000;

const API_BASE = 'https://api.cloudflare.com/client/v4/accounts';

/**
 * Renders through Cloudflare's browser rendering pdf endpoint, so no browser has
 * to live in the api image. The print sheet declares its own `@page` size and
 * margins, which is why the page size is taken from the css rather than passed
 * as an option.
 *
 * Note that the rendered html reaches Cloudflare as a request body: it carries
 * the recipient's name, address and, on an invoice letter, the payment
 * reference.
 */
export class CloudflarePdfRenderer extends BasePdfRenderer {
  private readonly fallback: NonNullable<
    CloudflarePdfRendererProps['fallback']
  >;

  constructor(props: CloudflarePdfRendererProps) {
    super(props);
    this.fallback = props.fallback ?? {};
  }

  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();

    return !!(
      (config?.cloudflare_accountId || this.fallback.accountId) &&
      (config?.cloudflare_apiToken || this.fallback.apiToken)
    );
  }

  async render(html: string): Promise<Buffer> {
    const config = await this.getConfig();
    const accountId = config?.cloudflare_accountId || this.fallback.accountId;
    const apiToken = config?.cloudflare_apiToken || this.fallback.apiToken;
    const timeoutMs = config?.timeoutMs || DEFAULT_TIMEOUT_MS;

    if (!accountId || !apiToken) {
      throw new PdfRendererError(
        `No Cloudflare account id and api token configured for pdf renderer ${this.id}`
      );
    }

    return this.fetchPdf(`${API_BASE}/${accountId}/browser-rendering/pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html,
        pdfOptions: {
          printBackground: true,
          preferCSSPageSize: true,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  }
}
