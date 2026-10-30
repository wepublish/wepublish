import type { ImageObject, QuantitativeValue } from 'schema-dts';

const PIXEL_UNIT_CODE = 'E37';

type SeoImage = {
  url?: string | null;
  m?: string | null;
  height?: number | null;
  width?: number | null;
};

const pixels = (value: number | null | undefined) =>
  typeof value === 'number' ?
    ({
      '@type': 'QuantitativeValue',
      value,
      unitCode: PIXEL_UNIT_CODE,
    } satisfies QuantitativeValue)
  : undefined;

export const seoImageObject = (image: SeoImage | null | undefined) => {
  if (!image?.url) {
    return undefined;
  }

  return {
    '@type': 'ImageObject',
    height: pixels(image.height),
    width: pixels(image.width),
    representativeOfPage: true,
    contentUrl: image.url,
    thumbnailUrl: image.m ?? undefined,
    url: image.url,
  } satisfies ImageObject;
};
