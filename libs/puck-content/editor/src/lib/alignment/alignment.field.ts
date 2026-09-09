import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type AlignmentValue = 'left' | 'start' | 'center' | 'right' | 'end';

export type AlignmentField = BaseField & {
  type: 'alignment';
  alignments?: AlignmentValue[];
};

export const alignmentSchema = (
  alignments: AlignmentValue[] = ['start', 'center', 'end']
) => z.enum(alignments);

export const alignmentFieldAi = (
  alignments: AlignmentValue[] = ['start', 'center', 'end']
): FieldAiParams => ({
  instructions: `Horizontal alignment of the element. One of: ${alignments.join(', ')}.`,
  schema: toAiSchema(alignmentSchema(alignments)),
});
