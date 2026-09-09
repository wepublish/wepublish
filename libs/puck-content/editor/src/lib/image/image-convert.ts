import { captureException } from '@sentry/react';

/**
 * Image formats the media server accepts, mirrors the
 * SupportedImagesValidator in @wepublish/media/api.
 */
export const supportedImageMimeTypes = [
  'image/webp',
  'image/png',
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/avif',
  'image/tiff',
];

/** Multer limit of the media server (apps/media) */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
/** M_PIXEL_LIMIT of the media server transform guard */
export const MAX_IMAGE_MEGAPIXELS = 20;

const WEBP_QUALITY_STEPS = [0.9, 0.8, 0.7];
const DOWNSCALE_STEP = 0.8;

export const isSupportedImage = (file: File) =>
  supportedImageMimeTypes.includes(file.type);

type DecodedImage = ImageBitmap | HTMLImageElement;

const decodeImage = async (file: File): Promise<DecodedImage> => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> based decoder, e.g. for SVGs in browsers
      // whose createImageBitmap does not handle them
    }
  }

  const url = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not decode ${file.name}`));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

const imageSize = (source: DecodedImage) =>
  'naturalWidth' in source ?
    { width: source.naturalWidth, height: source.naturalHeight }
  : { width: source.width, height: source.height };

/**
 * Scale factor (<= 1) that brings the image down to the megapixel limit.
 */
const fitToMegapixels = (width: number, height: number) => {
  const megapixels = (width * height) / 1000 / 1000;

  return megapixels > MAX_IMAGE_MEGAPIXELS ?
      Math.sqrt(MAX_IMAGE_MEGAPIXELS / megapixels)
    : 1;
};

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));

const encodeWebp = async (
  source: DecodedImage,
  scale: number
): Promise<Blob | null> => {
  const { width, height } = imageSize(source);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  // Lower the quality first, only shrink further when that is not enough
  for (const quality of WEBP_QUALITY_STEPS) {
    const blob = await toBlob(canvas, 'image/webp', quality);

    if (!blob || blob.type !== 'image/webp') {
      return null;
    }

    if (blob.size <= MAX_IMAGE_BYTES) {
      return blob;
    }
  }

  return encodeWebp(source, scale * DOWNSCALE_STEP);
};

/**
 * Makes sure an image can be uploaded to the media server: formats it does
 * not accept (bmp, svg, heic, ...) are re-encoded as webp and images above
 * its pixel or byte limits are scaled down. Files that already fit are
 * returned untouched, as is anything the browser cannot decode so the server
 * can report its own error.
 */
export const prepareImageForUpload = async (file: File): Promise<File> => {
  let source: DecodedImage | undefined;

  try {
    source = await decodeImage(file);

    const { width, height } = imageSize(source);
    const scale = fitToMegapixels(width, height);

    if (isSupportedImage(file) && scale === 1 && file.size <= MAX_IMAGE_BYTES) {
      return file;
    }

    const blob = await encodeWebp(source, scale);

    if (!blob) {
      return file;
    }

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';

    return new File([blob], name, {
      type: 'image/webp',
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.error(error);
    captureException(error);

    return file;
  } finally {
    if (source && 'close' in source) {
      source.close();
    }
  }
};
