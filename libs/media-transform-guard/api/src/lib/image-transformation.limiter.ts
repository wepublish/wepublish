import { BadRequestException } from '@nestjs/common';

type ImageDimension = {
  height?: number;
  width?: number;
};

const ALLOWED_DIMENSIONS: ImageDimension[] = [
  // EDITOR FORMATS:
  { width: 100, height: 100 },
  { width: 280, height: 200 },
  { width: 400, height: 200 },
  { width: 800, height: 300 },
  { width: 260, height: 300 },
  { width: 300 },

  // WEBSITE FORMATS NORMAL
  { width: 1500 },
  { width: 1200 },
  { width: 1000 },
  { width: 800 },
  { width: 500 },
  { width: 300 },
  { width: 200 },

  // WEBSITE FORMATS SQUARE
  { width: 1500, height: 1500 },
  { width: 1200, height: 1200 },
  { width: 1000, height: 1000 },
  { width: 800, height: 800 },
  { width: 500, height: 500 },
  { width: 300, height: 300 },
  { width: 200, height: 200 },
];

if (process.env['EXTRA_ALLOWED_DIMENSIONS']) {
  const EXTRA_ALLOWED_IMAGE_DIMENSIONS = JSON.parse(
    process.env['EXTRA_ALLOWED_DIMENSIONS']
  ) as ImageDimension[];
  ALLOWED_DIMENSIONS.push(...EXTRA_ALLOWED_IMAGE_DIMENSIONS);
}

const ALLOWED_QUALITIES: number[] = [0.8];

if (process.env['EXTRA_ALLOWED_QUALITIES']) {
  const EXTRA_ALLOWED_QUALITIES = JSON.parse(
    process.env['EXTRA_ALLOWED_QUALITIES']
  ) as number[];
  ALLOWED_QUALITIES.push(...EXTRA_ALLOWED_QUALITIES);
}

export const validateImageDimension = (
  checkWidth: string | undefined,
  checkHeight: string | undefined
) => {
  const hasWidth = checkWidth != null;
  const hasHeight = checkHeight != null;

  let formatCheck: ImageDimension | undefined;
  if (hasWidth && !hasHeight) {
    formatCheck = ALLOWED_DIMENSIONS.find(
      d => d.width === parseInt(checkWidth) && d.height == null
    );
  } else if (!hasWidth && hasHeight) {
    formatCheck = ALLOWED_DIMENSIONS.find(
      d => d.width == null && d.height === parseInt(checkHeight)
    );
  } else if (hasWidth && hasHeight) {
    formatCheck = ALLOWED_DIMENSIONS.find(
      d =>
        d.width === parseInt(checkWidth) && d.height === parseInt(checkHeight)
    );
  } else {
    formatCheck = { width: undefined, height: undefined };
  }

  if (!formatCheck) {
    throw new BadRequestException(
      `Requested forbidden dimension (${checkWidth ?? '—'}x${checkHeight ?? '—'})`
    );
  }
};
