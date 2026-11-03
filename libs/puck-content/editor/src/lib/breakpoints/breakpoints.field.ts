import { Breakpoint } from '@mui/material';
import { BaseField, Field } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { UserFields } from '../fields';

export {
  breakpointsStyles,
  getActiveBreakpoint,
  resolveBreakpointValue,
  sortBreakpoints,
} from '@wepublish/puck-content/website';
export type { BreakpointsValue } from '@wepublish/puck-content/website';

// Defaults to any like puck's own Field type so concrete instances stay
// assignable to the generic UserFields union.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BreakpointsField<Props extends object = Record<string, any>> =
  BaseField & {
    type: 'breakpoints';
    hideLabel?: boolean;
    objectFields: {
      [SubPropName in keyof Props]:
        | Field<Props[SubPropName], UserFields[keyof UserFields]>
        | UserFields[keyof UserFields];
    };
  };

export const breakpointsSchema = (
  fields: Record<string, z.ZodType>,
  breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl']
) => {
  const breakpointSchema = z.object(fields).partial();

  return z
    .object(
      Object.fromEntries(
        breakpoints.map(breakpoint => [breakpoint, breakpointSchema])
      )
    )
    .partial();
};

export const breakpointsFieldAi = (
  fields: Record<string, z.ZodType>,
  breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl']
): FieldAiParams => ({
  instructions: `Responsive settings keyed by theme breakpoint (${breakpoints.join(', ')}, from smallest to largest). Each breakpoint applies from its minimum width upwards until a larger breakpoint overrides it. Always provide the smallest breakpoint (${breakpoints[0]}) as the base and only add larger breakpoints when the layout should differ there.`,
  schema: toAiSchema(breakpointsSchema(fields, breakpoints)),
});
