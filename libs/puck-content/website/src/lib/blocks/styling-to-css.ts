import { CSSObject, Theme } from '@emotion/react';
import { Breakpoint } from '@mui/material';

import { breakpointsStyles, BreakpointsValue } from '../values/breakpoints';
import { resolveColor } from '../values/color';
import { Side, sides } from '../values/sides';
import { spacingToCss } from '../values/spacing';
import {
  Corner,
  corners,
  defaultBackgroundPosition,
  defaultBackgroundSize,
  defaultOverlayOpacity,
  FontWeightValue,
  isLengthValue,
  MaxWidthValue,
  maxWidthUnits,
  radiusToCss,
} from '../values/styling';
import {
  getThemeTypographyVariants,
  resolveTypography,
} from '../values/typography';
import { PuckStyling } from './graphql-shape';

export type PuckBackgroundImage = { url: string; xxl?: string | null };

export type PuckBlockStylingLike = PuckStyling & {
  backgroundImageObject?: PuckBackgroundImage | null;
};

export type PuckBreakpointStyling = Partial<
  Record<Breakpoint, PuckBlockStylingLike | null>
>;

export type StylingToCssOptions = {
  marginSides?: readonly Side[];
  backgroundImageUrl?: string | null;
};

export type BreakpointStylingToCssOptions = {
  marginSides?: readonly Side[];
  backgroundImageUrls?: Partial<Record<string, string>>;
};

const capitalize = (key: string) =>
  `${key.charAt(0).toUpperCase()}${key.slice(1)}`;

const fontWeightKeys = {
  light: 'fontWeightLight',
  regular: 'fontWeightRegular',
  medium: 'fontWeightMedium',
  bold: 'fontWeightBold',
} satisfies Record<FontWeightValue, keyof Theme['typography']>;

const radiusKeys = {
  topLeft: 'borderTopLeftRadius',
  topRight: 'borderTopRightRadius',
  bottomRight: 'borderBottomRightRadius',
  bottomLeft: 'borderBottomLeftRadius',
} satisfies Record<Corner, keyof CSSObject>;

const typographyStyles = (theme: Theme, variant: string | null | undefined) =>
  variant && getThemeTypographyVariants(theme).includes(variant) ?
    resolveTypography(theme, { variant })
  : undefined;

const overlayLayer = (theme: Theme, styling: PuckBlockStylingLike) => {
  const color = resolveColor(theme, styling.overlay);

  if (!color) {
    return undefined;
  }

  const tint = `color-mix(in srgb, ${color} ${styling.overlayOpacity ?? defaultOverlayOpacity}%, transparent)`;

  return `linear-gradient(${tint}, ${tint})`;
};

const maxWidthToCss = (
  theme: Theme,
  value: MaxWidthValue | null | undefined
) => {
  if (!value) {
    return undefined;
  }

  if (isLengthValue(value, maxWidthUnits)) {
    return value;
  }

  const width: number | undefined = theme.breakpoints.values[value];

  return width === undefined ? undefined : (
      `${width}${theme.breakpoints.unit ?? 'px'}`
    );
};

export const puckBackgroundImageUrl = (
  styling: PuckBlockStylingLike | null | undefined,
  options: StylingToCssOptions = {}
): string | undefined =>
  options.backgroundImageUrl ??
  styling?.backgroundImageObject?.xxl ??
  styling?.backgroundImageObject?.url ??
  undefined;

export const stylingToCss = (
  theme: Theme,
  styling: PuckBlockStylingLike | null | undefined,
  options: StylingToCssOptions = {}
): CSSObject => {
  if (!styling) {
    return {};
  }

  const { marginSides = sides } = options;
  const styles: CSSObject = {
    ...(typographyStyles(theme, styling.typography) as CSSObject | undefined),
  };
  const color = resolveColor(theme, styling.color);
  const background = resolveColor(theme, styling.background);

  if (color) {
    styles.color = color;
  }

  if (styling.fontWeight) {
    styles.fontWeight = theme.typography[fontWeightKeys[styling.fontWeight]];
  }

  if (styling.textTransform) {
    styles.textTransform = styling.textTransform;
  }

  if (styling.textAlign) {
    styles.textAlign = styling.textAlign;
  }

  if (background) {
    styles.backgroundColor = background;
  }

  const backgroundImage =
    styling.backgroundImage ?
      puckBackgroundImageUrl(styling, options)
    : undefined;
  const layers = [
    overlayLayer(theme, styling),
    backgroundImage && `url(${JSON.stringify(backgroundImage)})`,
  ].filter(Boolean);

  if (layers.length) {
    styles.backgroundImage = layers.join(', ');
  }

  if (backgroundImage) {
    styles.backgroundSize = styling.backgroundSize ?? defaultBackgroundSize;
    styles.backgroundPosition =
      styling.backgroundPosition ?? defaultBackgroundPosition;
    styles.backgroundRepeat = 'no-repeat';
  }

  const borderColor =
    resolveColor(theme, styling.border?.color) ?? 'currentColor';

  for (const side of sides) {
    const width = styling.border?.width?.[side];

    if (width) {
      styles[`border${capitalize(side)}`] =
        `${width}px ${styling.border?.style ?? 'solid'} ${borderColor}`;
    }
  }

  for (const corner of corners) {
    const radius = radiusToCss(theme, styling.borderRadius?.[corner]);

    if (radius !== undefined) {
      styles[radiusKeys[corner]] = radius;
    }
  }

  if (styling.cornerShape) {
    styles.cornerShape = styling.cornerShape;
  }

  for (const side of marginSides) {
    const margin = spacingToCss(theme, styling.margin?.[side]);

    if (margin !== undefined) {
      styles[`margin${capitalize(side)}`] = margin;
    }
  }

  for (const side of sides) {
    const padding = spacingToCss(theme, styling.padding?.[side]);

    if (padding !== undefined) {
      styles[`padding${capitalize(side)}`] = padding;
    }
  }

  if (styling.minHeight) {
    styles.minHeight = styling.minHeight;
  }

  const maxWidth = maxWidthToCss(theme, styling.maxWidth);

  if (maxWidth) {
    styles.maxWidth = maxWidth;
  }

  const shadow =
    styling.shadow === undefined || styling.shadow === null ?
      undefined
    : theme.shadows[styling.shadow];

  if (shadow) {
    styles.boxShadow = shadow;
  }

  if (styling.opacity !== undefined && styling.opacity !== null) {
    styles.opacity = styling.opacity / 100;
  }

  return styles;
};

const withoutNullEntries = (styling: PuckBlockStylingLike) =>
  Object.fromEntries(
    Object.entries(styling).filter(([, entry]) => entry !== null)
  ) as PuckBlockStylingLike;

const toBreakpointsValue = (
  theme: Theme,
  styling: PuckBreakpointStyling
): BreakpointsValue<PuckBlockStylingLike> =>
  Object.fromEntries([
    [theme.breakpoints.keys[0], {}],
    ...Object.entries(styling)
      .filter(([, value]) => value)
      .map(([breakpoint, value]) => [
        breakpoint,
        withoutNullEntries(value as PuckBlockStylingLike),
      ]),
  ]);

export const breakpointStylingToCss = (
  theme: Theme,
  styling: PuckBreakpointStyling | null | undefined,
  { marginSides, backgroundImageUrls }: BreakpointStylingToCssOptions = {}
): CSSObject => {
  if (!styling) {
    return {};
  }

  const styles = breakpointsStyles(
    theme,
    toBreakpointsValue(theme, styling),
    resolved =>
      stylingToCss(theme, resolved, {
        marginSides,
        backgroundImageUrl:
          resolved?.backgroundImage ?
            backgroundImageUrls?.[resolved.backgroundImage]
          : undefined,
      })
  );

  return Object.fromEntries(
    Object.entries(styles).filter(
      ([, value]) =>
        typeof value !== 'object' ||
        value === null ||
        Object.keys(value).length > 0
    )
  );
};
