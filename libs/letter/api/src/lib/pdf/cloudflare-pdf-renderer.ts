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

    let response: Response;

    try {
      response = await fetch(`${API_BASE}/${accountId}/browser-rendering/pdf`, {
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
    } catch (error) {
      throw new PdfRendererError(
        `Could not reach the pdf renderer: ${(error as Error).message}`
      );
    }

    if (!response.ok) {
      throw new PdfRendererError(await this.describeFailure(response));
    }

    const pdf = Buffer.from(await response.arrayBuffer());

    // A json body where a pdf is expected means the endpoint reported a problem
    // with a 200, which would otherwise be printed and posted as a broken file.
    if (!pdf.subarray(0, 5).toString('latin1').startsWith('%PDF-')) {
      throw new PdfRendererError(
        `The pdf renderer did not return a pdf: ${pdf
          .subarray(0, 200)
          .toString('utf8')}`
      );
    }

    return pdf;
  }

  private async describeFailure(response: Response): Promise<string> {
    const retryAfter = response.headers.get('retry-after');
    const body = await response.text().catch(() => '');
    const reason =
      response.status === 429 ?
        `the rate limit was reached${
          retryAfter ? `, retry after ${retryAfter}s` : ''
        }`
      : `status ${response.status}`;

    return `The pdf renderer refused the request (${reason}): ${body.slice(
      0,
      300
    )}`;
  }
}
