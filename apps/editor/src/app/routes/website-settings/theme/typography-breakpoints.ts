import { minimalTheme } from '@wepublish/ui';
import type { CSSProperties } from 'react';

import { UnitConfig } from './length-slider';

export type ScreenSize = 'sm' | 'md' | 'lg' | 'xl';
export type ResponsiveProperty = 'fontSize' | 'lineHeight' | 'letterSpacing';
export type InheritedFrom =
  'xs' | ScreenSize | 'allVariants' | 'theme' | 'browser';

type LengthValue = string | null | undefined;
type Override = Partial<Record<ResponsiveProperty, LengthValue>>;
type Item = Override & Record<string, unknown>;
type MaybeItem = Item | null | undefined;
type AllVariants =
  | Partial<Record<'lineHeight' | 'letterSpacing', LengthValue>>
  | null
  | undefined;

export const screenSizes = (['sm', 'md', 'lg', 'xl'] as ScreenSize[]).sort(
  (a, b) =>
    minimalTheme.breakpoints.values[a] - minimalTheme.breakpoints.values[b]
);

export const screenSizeWidth = (screenSize: ScreenSize) =>
  minimalTheme.breakpoints.values[screenSize];

export const mediaQuery = (screenSize: ScreenSize) =>
  minimalTheme.breakpoints.up(screenSize) as `@media ${string}`;

export const isMediaQuery = (key: string) => key.startsWith('@media');

const overrideOf = (item: MaybeItem, screenSize: ScreenSize) =>
  item?.[mediaQuery(screenSize)] as Override | null | undefined;

export const usedScreenSizes = (item: MaybeItem) =>
  screenSizes.filter(screenSize => !!overrideOf(item, screenSize));

export const overriddenScreenSizes = (item: MaybeItem) =>
  screenSizes.filter(screenSize =>
    Object.values(overrideOf(item, screenSize) ?? {}).some(
      value => value != null
    )
  );

export const missingScreenSizes = (item: MaybeItem) =>
  screenSizes.filter(screenSize => !overrideOf(item, screenSize));

export const withScreenSize = <T extends object>(
  item: T | null | undefined,
  screenSize: ScreenSize,
  override: Override
): T => {
  const queries: string[] = screenSizes.map(mediaQuery);
  const values: Record<string, unknown> = {
    ...item,
    [mediaQuery(screenSize)]: override,
  };

  return Object.fromEntries([
    ...Object.entries(values).filter(([key]) => !queries.includes(key)),
    ...queries
      .filter(query => query in values)
      .map(query => [query, values[query]]),
  ]) as T;
};

export const withoutScreenSize = <T extends object>(
  item: T | null | undefined,
  screenSize: ScreenSize
): T =>
  Object.fromEntries(
    Object.entries(item ?? {}).filter(([key]) => key !== mediaQuery(screenSize))
  ) as T;

const minWidthQuery = /^@media \(min-width:\s*(\d+(?:\.\d+)?)px\)$/;

const toLength = (value: unknown, property: ResponsiveProperty) => {
  if (typeof value === 'number') {
    return `${value}${property === 'fontSize' ? 'px' : 'em'}`;
  }

  return typeof value === 'string' && value ? value : undefined;
};

const themeStyles = (variant: string | undefined) => {
  const styles =
    variant ?
      (minimalTheme.typography as unknown as Record<string, unknown>)[variant]
    : undefined;

  return typeof styles === 'object' && styles !== null ?
      (styles as Record<string, unknown>)
    : undefined;
};

const themeFontWeight = (variant: string | undefined) => {
  const value = themeStyles(variant)?.fontWeight;

  return typeof value === 'number' || typeof value === 'string' ?
      value
    : undefined;
};

const themeValue = (
  variant: string,
  property: ResponsiveProperty,
  screenSize: 'xs' | ScreenSize
) => {
  const styles = themeStyles(variant);

  if (!styles) {
    return undefined;
  }

  const width =
    screenSize === 'xs' ? 0 : minimalTheme.breakpoints.values[screenSize];
  const queries = Object.entries(styles)
    .map(([key, value]) => [Number(minWidthQuery.exec(key)?.[1]), value])
    .filter(
      (entry): entry is [number, Record<string, unknown>] =>
        !isNaN(entry[0] as number) &&
        (entry[0] as number) <= width &&
        typeof entry[1] === 'object' &&
        entry[1] !== null
    )
    .sort(([a], [b]) => b - a);

  for (const [, query] of queries) {
    const value = toLength(query[property], property);

    if (value) {
      return value;
    }
  }

  return toLength(styles[property], property);
};

export const inheritedValue = (
  item: MaybeItem,
  allVariants: AllVariants,
  property: ResponsiveProperty,
  screenSize: 'xs' | ScreenSize,
  variant?: string
): { value: string; from: InheritedFrom } | undefined => {
  if (screenSize !== 'xs') {
    const smaller = screenSizes
      .slice(0, screenSizes.indexOf(screenSize))
      .reverse();

    for (const candidate of smaller) {
      const value = overrideOf(item, candidate)?.[property];

      if (value != null) {
        return { value, from: candidate };
      }
    }

    if (item?.[property] != null) {
      return { value: item[property] as string, from: 'xs' };
    }
  }

  const general = property === 'fontSize' ? undefined : allVariants?.[property];

  if (general != null) {
    return { value: general, from: 'allVariants' };
  }

  const standard = variant && themeValue(variant, property, screenSize);

  if (standard) {
    return { value: standard, from: 'theme' };
  }

  return property === 'letterSpacing' ?
      { value: '0em', from: 'browser' }
    : undefined;
};

export const resolvedValue = (
  item: MaybeItem,
  allVariants: AllVariants,
  property: ResponsiveProperty,
  screenSize: 'xs' | ScreenSize,
  variant?: string
) => {
  const own =
    screenSize === 'xs' ?
      item?.[property]
    : overrideOf(item, screenSize)?.[property];

  return (
    own ??
    inheritedValue(item, allVariants, property, screenSize, variant)?.value
  );
};

type GlobalStyles = {
  fontFamily?: string | null;
  fontWeight?: string | number | null;
  textTransform?: string | null;
  fontStyle?: string | null;
};

export const resolvedStyles = (
  item: (Item & GlobalStyles) | null | undefined,
  allVariants:
    | (NonNullable<AllVariants> &
        Omit<GlobalStyles, 'textTransform' | 'fontStyle'>)
    | null
    | undefined,
  screenSize: 'xs' | ScreenSize,
  variant?: string
) => ({
  fontSize: resolvedValue(item, allVariants, 'fontSize', screenSize, variant),
  lineHeight: resolvedValue(
    item,
    allVariants,
    'lineHeight',
    screenSize,
    variant
  ),
  letterSpacing: resolvedValue(
    item,
    allVariants,
    'letterSpacing',
    screenSize,
    variant
  ),
  fontWeight:
    item?.fontWeight ??
    themeFontWeight(variant) ??
    allVariants?.fontWeight ??
    undefined,
  fontFamily: item?.fontFamily || allVariants?.fontFamily || 'sans-serif',
  textTransform: (item?.textTransform ?? undefined) as
    CSSProperties['textTransform'] | undefined,
  fontStyle: item?.fontStyle ?? undefined,
});

const lengthPattern = /^(-?\d*\.?\d+)(em|rem|px)?$/;

export const fitToRange = (value: string, unitConfig: UnitConfig) => {
  const match = lengthPattern.exec(value.trim());

  if (!match) {
    return value;
  }

  const unit = (match[2] ?? 'em') as keyof UnitConfig;
  const { min, max } = unitConfig[unit];
  const num = Math.min(max, Math.max(min, parseFloat(match[1])));

  return `${num}${unit}`;
};

const hasErrors = (value: unknown) =>
  typeof value === 'object' && value !== null && Object.keys(value).length > 0;

export const screenSizesWithErrors = (
  errors: unknown
): ('xs' | ScreenSize)[] => {
  if (typeof errors !== 'object' || errors === null) {
    return [];
  }

  const fieldErrors = errors as Record<string, unknown>;
  const base = Object.keys(fieldErrors).filter(key => !isMediaQuery(key));

  return [
    ...(base.length ? (['xs'] as const) : []),
    ...screenSizes.filter(screenSize =>
      hasErrors(fieldErrors[mediaQuery(screenSize)])
    ),
  ];
};
