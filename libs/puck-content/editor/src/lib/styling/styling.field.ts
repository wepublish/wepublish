import { Breakpoint } from '@mui/material';
import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';
import {
  BackgroundPositionValue,
  BackgroundSizeValue,
  Corner,
  corners,
  CornerShapeValue,
  cornerShapes,
  FontWeightValue,
  LengthUnit,
  LengthValue,
  maxWidthBreakpoints,
  maxWidthUnits,
  MaxWidthValue,
  minHeightUnits,
  MinHeightValue,
  TextAlignValue,
  TextTransformValue,
} from '@wepublish/puck-content/website';

import { alignmentSchema } from '../alignment/alignment.field';
import {
  breakpointsFieldAi,
  BreakpointsValue,
} from '../breakpoints/breakpoints.field';
import { borderSchema, BorderValue } from '../border/border.field';
import { colorSchema, ColorValue } from '../color/color.field';
import { imageSchema, ImageValue } from '../image/image.field';
import { paddingSchema, PaddingValue } from '../padding/padding.field';
import { Side, sides, sidesSchema, SidesValue } from '../sides/sides';
import { SpacingValue } from '../spacing/spacing';

export {
  corners,
  cornerShapes,
  defaultBackgroundPosition,
  defaultBackgroundSize,
  defaultOverlayOpacity,
  isLengthValue,
  maxWidthBreakpoints,
  maxWidthUnits,
  minHeightUnits,
  radiusToCss,
  toLengthParts,
} from '@wepublish/puck-content/website';
export type {
  BackgroundPositionValue,
  BackgroundSizeValue,
  Corner,
  CornerShapeValue,
  FontWeightValue,
  LengthUnit,
  LengthValue,
  MaxWidthValue,
  MinHeightValue,
  TextAlignValue,
  TextTransformValue,
} from '@wepublish/puck-content/website';
export const textAlignValues: TextAlignValue[] = ['left', 'center', 'right'];
export const fontWeightValues: FontWeightValue[] = [
  'light',
  'regular',
  'medium',
  'bold',
];
export const textTransformValues: TextTransformValue[] = [
  'none',
  'uppercase',
  'lowercase',
  'capitalize',
];
export const backgroundSizeValues: BackgroundSizeValue[] = [
  'cover',
  'contain',
  'auto',
];

export type BackgroundPositionX = 'left' | 'center' | 'right';
export type BackgroundPositionY = 'top' | 'center' | 'bottom';
export const backgroundPositionValues: BackgroundPositionValue[] = [
  'left top',
  'center top',
  'right top',
  'left center',
  'center center',
  'right center',
  'left bottom',
  'center bottom',
  'right bottom',
];
export type RadiusValue = Partial<Record<Corner, SpacingValue>>;

export type MinHeightUnit = Extract<LengthUnit, 'px' | 'vh'>;

export type MaxWidthUnit = Extract<LengthUnit, 'px' | '%'>;
export type MaxWidthBreakpoint = Extract<Breakpoint, 'sm' | 'md' | 'lg' | 'xl'>;

export const shadowSteps = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24];
export const maxShadow = 24;

export type StylingValue = {
  typography?: string;
  textAlign?: TextAlignValue;
  color?: ColorValue;
  fontWeight?: FontWeightValue;
  textTransform?: TextTransformValue;
  background?: ColorValue;
  backgroundImage?: ImageValue;
  backgroundSize?: BackgroundSizeValue;
  backgroundPosition?: BackgroundPositionValue;
  overlay?: ColorValue;
  overlayOpacity?: number;
  margin?: SidesValue;
  padding?: PaddingValue;
  border?: BorderValue;
  borderRadius?: RadiusValue;
  cornerShape?: CornerShapeValue;
  minHeight?: MinHeightValue;
  maxWidth?: MaxWidthValue;
  shadow?: number;
  opacity?: number;
};

export type BreakpointStylingValue = BreakpointsValue<StylingValue>;

export type StylingField = BaseField & {
  type: 'styling';
  marginSides?: Side[];
  groups?: StylingGroup[];
};

export type StylingGroup =
  'text' | 'background' | 'spacing' | 'border' | 'size' | 'effects';

export const stylingGroups: StylingGroup[] = [
  'text',
  'background',
  'spacing',
  'border',
  'size',
  'effects',
];

export const textlessStylingGroups = stylingGroups.filter(
  group => group !== 'text'
);

export const stylingGroupKeys: Record<StylingGroup, (keyof StylingValue)[]> = {
  text: ['typography', 'textAlign', 'color', 'fontWeight', 'textTransform'],
  background: [
    'background',
    'backgroundImage',
    'backgroundSize',
    'backgroundPosition',
    'overlay',
    'overlayOpacity',
  ],
  spacing: ['margin', 'padding'],
  border: ['border', 'borderRadius', 'cornerShape'],
  size: ['minHeight', 'maxWidth'],
  effects: ['shadow', 'opacity'],
};

export const hasStylingValue = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  if (typeof value === 'object') {
    return Object.values(value).some(hasStylingValue);
  }

  return true;
};

export const compactStyling = (
  value: StylingValue | undefined
): StylingValue | undefined => {
  const entries = Object.entries(value ?? {}).filter(([, entry]) =>
    hasStylingValue(entry)
  );

  return entries.length ? Object.fromEntries(entries) : undefined;
};

export const setStyling = (
  value: StylingValue | undefined,
  patch: Partial<StylingValue>
): StylingValue | undefined => compactStyling({ ...value, ...patch });

export const isStylingGroupModified = (
  value: StylingValue | undefined,
  group: StylingGroup
) => stylingGroupKeys[group].some(key => hasStylingValue(value?.[key]));

export const resetStylingGroup = (
  value: StylingValue | undefined,
  group: StylingGroup
): StylingValue | undefined => {
  const groupKeys: readonly string[] = stylingGroupKeys[group];

  return compactStyling(
    Object.fromEntries(
      Object.entries(value ?? {}).filter(([key]) => !groupKeys.includes(key))
    )
  );
};

export const setBreakpointStyling = (
  value: BreakpointStylingValue | undefined,
  breakpoint: Breakpoint,
  styling: StylingValue | undefined
): BreakpointStylingValue | undefined => {
  const next: BreakpointStylingValue = {
    ...value,
    [breakpoint]: styling ?? {},
  };
  const keepsBreakpoints = Object.keys(next).some(key => key !== 'xs');

  return keepsBreakpoints || hasStylingValue(next) ? next : undefined;
};

const breakpointKeys: readonly string[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export const toBreakpointStyling = (
  value: unknown
): BreakpointStylingValue | undefined => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return Object.keys(value).every(key => breakpointKeys.includes(key)) ?
      (value as BreakpointStylingValue)
    : { xs: value as StylingValue };
};

export const headingLevel = (variant: string): number | undefined => {
  const match = variant.match(/^h([1-6])$/);

  return match ? Number(match[1]) : undefined;
};

export const humanizeTypographyVariant = (variant: string): string => {
  const words = variant
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .toLowerCase();

  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

export const fromLengthParts = <Unit extends LengthUnit>(
  amount: number | undefined,
  unit: Unit
): LengthValue<Unit> | undefined =>
  amount === undefined ? undefined : `${amount}${unit}`;

const lengthSchema = (units: readonly LengthUnit[]) =>
  z.string().regex(new RegExp(`^\\d+(\\.\\d+)?(${units.join('|')})$`));

const percentSchema = z.number().min(0).max(100);

const radiusAmountSchema = z
  .union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?px$/)])
  .describe(
    'A multiple of the theme border radius, or an exact pixel value as a string like "8px"'
  );

const radiusSchema = z
  .object(
    Object.fromEntries(
      corners.map(corner => [corner, radiusAmountSchema])
    ) as Record<Corner, typeof radiusAmountSchema>
  )
  .partial();

export const stylingSchema = (marginSides: Side[] = sides) =>
  z
    .object({
      typography: z
        .string()
        .describe(
          'Name of a theme typography variant such as h1-h6, subtitle1, subtitle2, body1, body2, caption or overline'
        ),
      textAlign: alignmentSchema(textAlignValues).describe('Text alignment'),
      color: colorSchema().describe('Text colour of the component'),
      fontWeight: z
        .enum(fontWeightValues)
        .describe('Font weight step of the theme'),
      textTransform: z
        .enum(textTransformValues)
        .describe('Letter case of the text, none keeps it as written'),
      background: colorSchema().describe('Background colour of the component'),
      backgroundImage: imageSchema.describe(
        'Id of an existing image in the image library shown as background. Keep the existing value and never invent one.'
      ),
      backgroundSize: z
        .enum(backgroundSizeValues)
        .describe(
          'How the background image fills the component, defaults to cover'
        ),
      backgroundPosition: z
        .enum(backgroundPositionValues)
        .describe(
          'Anchor point of the background image as "<x> <y>", defaults to center center'
        ),
      overlay: colorSchema().describe(
        'Colour laid over the background to keep text on top readable'
      ),
      overlayOpacity: percentSchema.describe(
        'Opacity of the overlay colour in percent, defaults to 50'
      ),
      margin: sidesSchema('margin', 'spacing', marginSides).describe(
        'Outer spacing per side'
      ),
      padding: paddingSchema.describe('Inner spacing per side'),
      border: borderSchema.describe('Border of the component'),
      borderRadius: radiusSchema.describe('Corner radius per corner'),
      cornerShape: z
        .enum(cornerShapes)
        .describe(
          'Shape of every rounded corner, only visible together with a corner radius. Defaults to round; squircle is a smooth superellipse, bevel cuts the corner straight, scoop curves it inwards, notch cuts a square into it and square keeps it sharp. Browsers without support fall back to round corners.'
        ),
      minHeight: lengthSchema(minHeightUnits).describe(
        'Minimum height in pixels like "320px" or in percent of the viewport height like "50vh"'
      ),
      maxWidth: z
        .union([z.enum(maxWidthBreakpoints), lengthSchema(maxWidthUnits)])
        .describe(
          'Maximum width: a theme breakpoint (sm, md, lg, xl) to match the page grid, or pixels like "640px" or percent like "80%"'
        ),
      shadow: z
        .number()
        .int()
        .min(0)
        .max(maxShadow)
        .describe('Theme shadow elevation, 0 removes the shadow'),
      opacity: percentSchema.describe(
        'Opacity of the whole component in percent'
      ),
    })
    .partial();

const pickStylingGroups = <Shape extends z.ZodRawShape>(
  schema: z.ZodObject<Shape>,
  groups: StylingGroup[]
) => {
  const keys = groups.flatMap(group => stylingGroupKeys[group]);

  return schema.pick(
    Object.fromEntries(keys.map(key => [key, true])) as Partial<
      Record<keyof Shape, true>
    >
  );
};

export const stylingFieldAi = (
  marginSides?: Side[],
  groups: StylingGroup[] = stylingGroups
): FieldAiParams => {
  const perBreakpoint = breakpointsFieldAi(
    pickStylingGroups(stylingSchema(marginSides), groups).shape
  );

  return {
    instructions: `Styling of the component, grouped into text (typography variant, alignment, colour, weight, letter case), background (colour, image with size and position, overlay), spacing (margin outside the border, padding inside it), border (line, corner radius and corner shape), size (minimum height, maximum width) and effects (shadow, opacity). Prefer theme values and leave out anything that should keep the component default. ${perBreakpoint.instructions} A larger breakpoint only needs the keys that change there.`,
    schema: perBreakpoint.schema,
  };
};
