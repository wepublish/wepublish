export class PdfRendererError extends Error {}

export interface PdfRenderer {
  /** Whether everything needed to render is set, so letters can be offered. */
  isConfigured(): Promise<boolean>;
  render(html: string): Promise<Buffer>;
  /** Whether `convertDocument` can work, so attachments can be offered. */
  canConvertDocuments(): Promise<boolean>;
  /**
   * Convert an office document (e.g. a filled-in Word file) to pdf. The
   * filename's extension tells the renderer what it is. Renderers that only
   * print html refuse with a `PdfRendererError`.
   */
  convertDocument(file: Uint8Array, filename: string): Promise<Buffer>;
}
