import { Breakpoint } from '@mui/material';
import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

/**
 * The breakpoints a component is shown on. `undefined` shows it everywhere.
 */
export type VisibilityValue = Breakpoint[];

export type VisibilityField = BaseField & {
  type: 'visibility';
};

export const defaultBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export const visibilitySchema = (
  breakpoints: Breakpoint[] = defaultBreakpoints
) => z.array(z.enum(breakpoints as [Breakpoint, ...Breakpoint[]]));

export const visibilityFieldAi = (
  breakpoints: Breakpoint[] = defaultBreakpoints
): FieldAiParams => ({
  instructions: `The theme breakpoints (${breakpoints.join(', ')}, from smallest to largest) the component is visible on. Omit it to show the component everywhere; only set it to hide the component on specific screen sizes.`,
  schema: toAiSchema(visibilitySchema(breakpoints)),
});

/**
 * Whether a component with the given value is hidden on a breakpoint.
 */
export const isHiddenOn = (
  value: VisibilityValue | undefined,
  breakpoint: Breakpoint
) => !!value && !value.includes(breakpoint);
