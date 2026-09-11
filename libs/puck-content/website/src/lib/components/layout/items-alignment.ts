import { CSSObject } from '@emotion/react';
import { SelectField } from '@puckeditor/core';
import { z } from 'zod/v4';

import {
  AlignmentField,
  alignmentFieldAi,
  alignmentSchema,
  AlignmentValue,
} from '@wepublish/puck-content/editor';

export type AlignItemsValue = Extract<
  AlignmentValue,
  'start' | 'center' | 'end' | 'stretch'
>;

export const alignItemsValues: AlignItemsValue[] = [
  'start',
  'center',
  'end',
  'stretch',
];

export type JustifyContentValue =
  | 'start'
  | 'center'
  | 'end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

export const justifyContentOptions: {
  label: string;
  value: JustifyContentValue;
}[] = [
  { label: 'Start', value: 'start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'end' },
  { label: 'Space between', value: 'space-between' },
  { label: 'Space around', value: 'space-around' },
  { label: 'Space evenly', value: 'space-evenly' },
];

export type ItemsAlignment = {
  alignItems?: AlignItemsValue;
  justifyContent?: JustifyContentValue;
};

/**
 * Sub fields for a breakpoints field controlling how the children of a
 * grid-like layout are placed: alignItems aligns them vertically within their
 * row, justifyContent distributes the columns horizontally along the row.
 */
export const itemsAlignmentFields: {
  alignItems: AlignmentField;
  justifyContent: SelectField;
} = {
  alignItems: {
    type: 'alignment',
    label: 'Align items',
    orientation: 'vertical',
    alignments: alignItemsValues,
    ai: alignmentFieldAi(alignItemsValues, 'vertical'),
  },
  justifyContent: {
    type: 'select',
    label: 'Justify content',
    options: justifyContentOptions,
  },
};

export const itemsAlignmentSchema = {
  alignItems: alignmentSchema(alignItemsValues).describe(
    'Vertical alignment of the children within their row'
  ),
  justifyContent: z
    .enum(justifyContentOptions.map(({ value }) => value))
    .describe('Horizontal distribution of the columns along the row'),
};

export const itemsAlignmentStyles = (
  alignment: ItemsAlignment | undefined
): CSSObject => ({
  alignItems: alignment?.alignItems,
  justifyContent: alignment?.justifyContent,
});
