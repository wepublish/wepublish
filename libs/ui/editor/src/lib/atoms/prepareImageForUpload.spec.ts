import {
  MAX_IMAGE_BYTES,
  prepareImageForUpload,
} from './prepareImageForUpload';

const mockDecodedSize = (width: number, height: number) => {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn().mockResolvedValue({ width, height, close: vi.fn() })
  );
};

const mockCanvas = (blob: Blob | null) => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback =>
    callback(blob)
  );
};

describe('prepareImageForUpload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps supported images within the limits untouched', async () => {
    mockDecodedSize(1000, 1000);
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

    expect(await prepareImageForUpload(file)).toBe(file);
  });

  it('re-encodes unsupported formats as webp', async () => {
    mockDecodedSize(1000, 1000);
    mockCanvas(new Blob(['webp'], { type: 'image/webp' }));
    const file = new File(['x'], 'scan.v2.bmp', { type: 'image/bmp' });

    const prepared = await prepareImageForUpload(file);

    expect(prepared.name).toBe('scan.v2.webp');
    expect(prepared.type).toBe('image/webp');
  });

  it('scales images above the megapixel limit down', async () => {
    mockDecodedSize(10000, 10000);
    mockCanvas(new Blob(['webp'], { type: 'image/webp' }));
    const file = new File(['x'], 'huge.png', { type: 'image/png' });

    const prepared = await prepareImageForUpload(file);

    expect(prepared.type).toBe('image/webp');
    expect(prepared.size).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  });

  it('returns the original file when the browser cannot encode webp', async () => {
    mockDecodedSize(1000, 1000);
    mockCanvas(new Blob(['png'], { type: 'image/png' }));
    const file = new File(['x'], 'scan.bmp', { type: 'image/bmp' });

    expect(await prepareImageForUpload(file)).toBe(file);
  });
});
