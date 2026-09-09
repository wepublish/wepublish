import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { RichtextJSONDocument } from '@wepublish/richtext';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type RichtextValue = RichtextJSONDocument;

export type RichtextField = BaseField & {
  type: 'richtext';
};

const richtextNodeTypes = [
  'paragraph',
  'heading',
  'text',
  'hardBreak',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'listItem',
] as const;

const richtextMarkTypes = [
  'bold',
  'italic',
  'underline',
  'strike',
  'subscript',
  'superscript',
  'link',
] as const;

const richtextAttrsSchema = z.record(z.string(), z.unknown());

export const richtextMarkSchema = z.object({
  type: z.enum(richtextMarkTypes),
  attrs: richtextAttrsSchema.optional(),
});

export const richtextNodeSchema = z.object({
  type: z.enum(richtextNodeTypes),
  attrs: richtextAttrsSchema.optional(),
  text: z.string().optional(),
  marks: z.array(richtextMarkSchema).optional(),
  get content() {
    return z.array(richtextNodeSchema).optional();
  },
});

export const richtextSchema = z.object({
  type: z.literal('doc'),
  content: z.array(richtextNodeSchema),
});

export const richtextFieldAi: FieldAiParams = {
  instructions:
    'Rich text content as a TipTap JSON document: a { "type": "doc", "content": [...] } tree. Block nodes are paragraph, heading (attrs.level 1-6), bulletList, orderedList (containing listItem), blockquote, codeBlock (attrs.language) and hardBreak. The copy lives in { "type": "text", "text": "..." } leaf nodes, which can carry marks such as bold, italic, underline, strike and link (attrs.href). Never return plain strings or HTML.',
  schema: toAiSchema(richtextSchema),
};
