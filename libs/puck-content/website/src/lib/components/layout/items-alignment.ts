import { CSSObject } from '@emotion/react';

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

export type JustifyContentValue = Extract<
  AlignmentValue,
  'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
>;

export const justifyContentValues: JustifyContentValue[] = [
  'start',
  'center',
  'end',
  'space-between',
  'space-around',
  'space-evenly',
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
  justifyContent: AlignmentField;
} = {
  alignItems: {
    type: 'alignment',
    label: 'Align items',
    orientation: 'vertical',
    alignments: alignItemsValues,
    ai: alignmentFieldAi(alignItemsValues, 'vertical'),
  },
  justifyContent: {
    type: 'alignment',
    label: 'Justify content',
    orientation: 'horizontal',
    alignments: justifyContentValues,
    ai: alignmentFieldAi(justifyContentValues, 'horizontal'),
  },
};

export const itemsAlignmentSchema = {
  alignItems: alignmentSchema(alignItemsValues).describe(
    'Vertical alignment of the children within their row'
  ),
  justifyContent: alignmentSchema(justifyContentValues).describe(
    'Horizontal distribution of the columns along the row'
  ),
};

export const itemsAlignmentStyles = (
  alignment: ItemsAlignment | undefined
): CSSObject => ({
  alignItems: alignment?.alignItems,
  justifyContent: alignment?.justifyContent,
});
