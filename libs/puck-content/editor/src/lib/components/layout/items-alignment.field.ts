import {
  alignItemsValues,
  justifyContentValues,
} from '@wepublish/puck-content/website';

import {
  AlignmentField,
  alignmentFieldAi,
  alignmentSchema,
} from '../../alignment/alignment.field';

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
