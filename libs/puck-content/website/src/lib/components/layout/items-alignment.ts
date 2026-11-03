import { CSSObject } from '@emotion/react';

import { AlignmentValue } from '../../values/alignment';

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

export const itemsAlignmentStyles = (
  alignment: ItemsAlignment | undefined
): CSSObject => ({
  alignItems: alignment?.alignItems,
  justifyContent: alignment?.justifyContent,
});
