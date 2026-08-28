export class PdfRendererError extends Error {}

export interface PdfRenderer {
  render(html: string): Promise<Buffer>;
}

export interface CloudflarePdfRendererProps {
  accountId: string;
  apiToken: string;
  timeoutMs?: number;
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
export class CloudflarePdfRenderer implements PdfRenderer {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly timeoutMs: number;

  constructor(props: CloudflarePdfRendererProps) {
    // Credentials are not required to construct: an install without letters
    // still has to boot. A send or preview without them fails in `render`.
    this.accountId = props.accountId;
    this.apiToken = props.apiToken;
    this.timeoutMs = props.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async render(html: string): Promise<Buffer> {
    if (!this.accountId || !this.apiToken) {
      throw new PdfRendererError(
        'No Cloudflare account id and api token configured for the pdf renderer'
      );
    }

    let response: Response;

    try {
      response = await fetch(
        `${API_BASE}/${this.accountId}/browser-rendering/pdf`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html,
            pdfOptions: {
              printBackground: true,
              preferCSSPageSize: true,
            },
          }),
          signal: AbortSignal.timeout(this.timeoutMs),
        }
      );
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
