export class PdfRendererError extends Error {}

export interface PdfRenderer {
  render(html: string): Promise<Buffer>;
}
