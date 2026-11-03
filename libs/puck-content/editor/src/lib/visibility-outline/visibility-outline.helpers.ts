import { Breakpoint } from '@mui/material';

import { defaultBreakpoints } from '../visibility/visibility.field';
import {
  blockVisibilityFlags,
  BlockVisibilityValue,
} from '../block-visibility/block-visibility.field';

export type BlockEntry = { id: string; value: BlockVisibilityValue };

const isRestricted = (value: BlockVisibilityValue) => {
  const { disabled, timed, breakpoints } = blockVisibilityFlags(value);

  return disabled || timed || !!breakpoints;
};

export const collectBlockVisibility = (node: unknown): BlockEntry[] => {
  if (Array.isArray(node)) {
    return node.flatMap(collectBlockVisibility);
  }

  if (!node || typeof node !== 'object') {
    return [];
  }

  const { type, props } = node as {
    type?: unknown;
    props?: Record<string, unknown>;
  };

  if (typeof type === 'string' && props && typeof props.id === 'string') {
    const value = props.visibility as BlockVisibilityValue | undefined;
    const own =
      value && typeof value === 'object' && isRestricted(value) ?
        [{ id: props.id, value }]
      : [];

    return [...own, ...collectBlockVisibility(Object.values(props))];
  }

  return collectBlockVisibility(Object.values(node));
};

const cssString = (text: string) => JSON.stringify(text);

export const outlineNameSelector = (id: string) =>
  `[data-puck-layer-tree-id=${cssString(id)}] > [class*="_Layer-inner"] [class*="_Layer-name"]`;

export const outlineBadges = (
  value: BlockVisibilityValue | undefined,
  breakpointOrder: Breakpoint[] = defaultBreakpoints
) => {
  const { disabled, timed, breakpoints } = blockVisibilityFlags(value);

  return {
    disabled,
    timed,
    breakpoints: breakpointOrder
      .filter(breakpoint => breakpoints?.includes(breakpoint))
      .map(breakpoint => breakpoint.toUpperCase()),
  };
};

export const outlineVisibilityCss = (entries: BlockEntry[]) =>
  entries
    .filter(({ value }) => value.disabled)
    .map(
      ({ id }) =>
        `${outlineNameSelector(id)} { opacity: 0.5; text-decoration: line-through; }`
    )
    .join('\n');
