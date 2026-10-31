import { CSSObject, Theme } from '@emotion/react';
import {
  Corner,
  corners,
  defaultBackgroundPosition,
  defaultBackgroundSize,
  defaultOverlayOpacity,
  FontWeightValue,
  getThemeTypographyVariants,
  isLengthValue,
  MaxWidthValue,
  maxWidthUnits,
  radiusToCss,
  resolveColor,
  resolveTypography,
  Side,
  sides,
  spacingToCss,
  StylingValue,
} from '@wepublish/puck-content/editor';

export type CSSValue = StylingValue;

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

const typographyStyles = (theme: Theme, variant: string | undefined) =>
  variant && getThemeTypographyVariants(theme).includes(variant) ?
    resolveTypography(theme, { variant })
  : undefined;

const overlayLayer = (theme: Theme, styling: CSSValue) => {
  const color = resolveColor(theme, styling.overlay);

  if (!color) {
    return undefined;
  }

  const tint = `color-mix(in srgb, ${color} ${styling.overlayOpacity ?? defaultOverlayOpacity}%, transparent)`;

  return `linear-gradient(${tint}, ${tint})`;
};

const maxWidthToCss = (theme: Theme, value: MaxWidthValue | undefined) => {
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

export const cssStyles = (
  theme: Theme,
  styling: CSSValue = {},
  marginSides: Side[] = sides,
  backgroundImageUrl?: string
): CSSObject => {
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
    styling.backgroundImage ? backgroundImageUrl : undefined;
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
        `${typeof width === 'number' ? `${width}px` : width} ${styling.border?.style ?? 'solid'} ${borderColor}`;
    }
  }

  for (const corner of corners) {
    const radius = radiusToCss(theme, styling.borderRadius?.[corner]);

    if (radius !== undefined) {
      styles[radiusKeys[corner]] = radius;
    }
  }

  for (const side of marginSides) {
    const margin = styling.margin?.[side];

    if (margin !== undefined) {
      styles[`margin${capitalize(side)}`] = spacingToCss(theme, margin);
    }
  }

  for (const side of sides) {
    const padding = styling.padding?.[side];

    if (padding !== undefined) {
      styles[`padding${capitalize(side)}`] = spacingToCss(theme, padding);
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
    styling.shadow === undefined ? undefined : theme.shadows[styling.shadow];

  if (shadow) {
    styles.boxShadow = shadow;
  }

  if (styling.opacity !== undefined) {
    styles.opacity = styling.opacity / 100;
  }

  return styles;
};
