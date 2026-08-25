export class PdfRendererError extends Error {}

export interface PdfRenderer {
  render(html: string): Promise<Buffer>;
}

export interface RemotePdfRendererProps {
  url: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60000;

const FILE_NAME = 'index.html';

/**
 * Renders through a stateless HTML to PDF conversion service that accepts a
 * multipart form with an `index.html` part, which is what Gotenberg's
 * `/forms/chromium/convert/html` route expects. Keeping the browser in its own
 * container keeps it out of the api image.
 */
export class RemotePdfRenderer implements PdfRenderer {
  private readonly url: string;
  private readonly timeoutMs: number;

  constructor(props: RemotePdfRendererProps) {
    this.url = props.url;
    this.timeoutMs = props.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async render(html: string): Promise<Buffer> {
    const form = new FormData();
    form.append('files', new Blob([html], { type: 'text/html' }), FILE_NAME);
    form.append('paperWidth', '8.27');
    form.append('paperHeight', '11.7');
    form.append('marginTop', '0');
    form.append('marginBottom', '0');
    form.append('marginLeft', '0');
    form.append('marginRight', '0');
    form.append('printBackground', 'true');
    form.append('preferCssPageSize', 'true');

    let response: Response;

    try {
      response = await fetch(this.url, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new PdfRendererError(
        `Could not reach the pdf renderer: ${(error as Error).message}`
      );
    }

    if (!response.ok) {
      throw new PdfRendererError(
        `The pdf renderer answered with status ${response.status}`
      );
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
