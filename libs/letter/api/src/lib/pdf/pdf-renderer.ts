export class PdfRendererError extends Error {}

export interface PdfRenderer {
  /** Whether everything needed to render is set, so letters can be offered. */
  isConfigured(): Promise<boolean>;
  render(html: string): Promise<Buffer>;
}
