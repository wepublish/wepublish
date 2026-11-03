import { CSSObject, Theme } from '@emotion/react';

import { breakpointsStyles, BreakpointsValue } from './breakpoints';

export const aspectRatioPresets = [
  'auto',
  '1:1',
  '4:3',
  '3:2',
  '16:9',
  '21:9',
  '3:4',
  '2:3',
  '9:16',
] as const;

export type AspectRatioPreset = (typeof aspectRatioPresets)[number];

export type AspectRatioValue = AspectRatioPreset | (string & {});

export const objectFitValues = [
  'cover',
  'contain',
  'fill',
  'none',
  'scale-down',
] as const;

export type ObjectFitValue = (typeof objectFitValues)[number];

export type ImageFitValue = {
  aspectRatio: AspectRatioValue;
  objectFit: ObjectFitValue;
};

export type ImageFit = BreakpointsValue<ImageFitValue>;

export type ResolvedImageFit = {
  ratio: string;
  objectFit: ObjectFitValue;
};

export type ImageFocalPoint = {
  focalPointX?: number | null;
  focalPointY?: number | null;
};

const aspectRatioPattern = /^\s*(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)\s*$/;

export const parseAspectRatio = (
  value: string | null | undefined
): [number, number] | null => {
  const match = value?.match(aspectRatioPattern);

  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);

  return width > 0 && height > 0 ? [width, height] : null;
};

export const aspectRatioCss = (value: string | null | undefined) => {
  const ratio = parseAspectRatio(value);

  return ratio ? `${ratio[0]} / ${ratio[1]}` : undefined;
};

export const focalPointPosition = (
  image: ImageFocalPoint | null | undefined
) =>
  image?.focalPointX != null && image.focalPointY != null ?
    `${image.focalPointX * 100}% ${image.focalPointY * 100}%`
  : 'center';

export const hasImageFit = (fit: ImageFit | null | undefined) =>
  Object.values(fit ?? {}).some(
    value => !!parseAspectRatio(value?.aspectRatio)
  );

export const imageFitStyles = (
  theme: Theme,
  fit: ImageFit | null | undefined,
  toStyles: (fit: ResolvedImageFit | null) => CSSObject
): CSSObject =>
  fit && hasImageFit(fit) ?
    breakpointsStyles(theme, fit, resolved => {
      const ratio = aspectRatioCss(resolved?.aspectRatio);

      return toStyles(
        ratio ? { ratio, objectFit: resolved?.objectFit ?? 'cover' } : null
      );
    })
  : {};
