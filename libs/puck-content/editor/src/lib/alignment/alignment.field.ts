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
  | 'stretch'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

export type AlignmentOrientation = 'horizontal' | 'vertical' | 'text';

export type AlignmentField = BaseField & {
  type: 'alignment';
  alignments?: AlignmentValue[];
  orientation?: AlignmentOrientation;
};

const orientationLabels: Record<AlignmentOrientation, string> = {
  horizontal: 'Horizontal alignment',
  vertical: 'Vertical alignment',
  text: 'Text alignment',
};

export const alignmentSchema = (
  alignments: AlignmentValue[] = ['start', 'center', 'end']
) => z.enum(alignments);

export const alignmentFieldAi = (
  alignments: AlignmentValue[] = ['start', 'center', 'end'],
  orientation: AlignmentOrientation = 'horizontal'
): FieldAiParams => ({
  instructions: `${orientationLabels[orientation]} of the element. One of: ${alignments.join(', ')}.`,
  schema: toAiSchema(alignmentSchema(alignments)),
});
