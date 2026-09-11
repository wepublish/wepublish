import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type AlignmentValue =
  | 'left'
  | 'start'
  | 'center'
  | 'right'
  | 'end'
  | 'stretch';

export type AlignmentOrientation = 'horizontal' | 'vertical';

export type AlignmentField = BaseField & {
  type: 'alignment';
  alignments?: AlignmentValue[];
  orientation?: AlignmentOrientation;
};

export const alignmentSchema = (
  alignments: AlignmentValue[] = ['start', 'center', 'end']
) => z.enum(alignments);

export const alignmentFieldAi = (
  alignments: AlignmentValue[] = ['start', 'center', 'end'],
  orientation: AlignmentOrientation = 'horizontal'
): FieldAiParams => ({
  instructions: `${orientation === 'vertical' ? 'Vertical' : 'Horizontal'} alignment of the element. One of: ${alignments.join(', ')}.`,
  schema: toAiSchema(alignmentSchema(alignments)),
});
