import type { z } from 'zod/v4';

export type ColorKindParams = { alpha?: boolean };

export const HEX_COLOR = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;

export const OPAQUE_HEX = /^#[\da-f]{6}$/i;

export const isOpaque = (params: unknown) =>
  typeof params === 'object' &&
  params !== null &&
  'alpha' in params &&
  params.alpha === false;

export const colorPattern = (params?: ColorKindParams) =>
  isOpaque(params) ? OPAQUE_HEX : HEX_COLOR;

export const colorError = (issue: z.core.$ZodRawIssue) =>
  issue.input === '' ? undefined : 'form.color.invalid';
