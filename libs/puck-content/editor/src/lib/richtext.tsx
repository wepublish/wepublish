import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';

import { UserFieldsConfig } from './fields';
import { RichtextJSONDocument } from '@wepublish/richtext';
import { RichtextEditor } from '@wepublish/richtext/editor';

export type RichtextValue = RichtextJSONDocument;

export type RichtextField = BaseField & {
  type: 'richtext';
};

export const richtextFieldAi: FieldAiParams = {
  instructions:
    'Rich text content as a TipTap JSON document: a { "type": "doc", "content": [...] } tree. Block nodes are paragraph, heading (attrs.level 1-6), bulletList, orderedList (containing listItem), blockquote, codeBlock (attrs.language) and hardBreak. The copy lives in { "type": "text", "text": "..." } leaf nodes, which can carry marks such as bold, italic, underline, strike and link (attrs.href). Never return plain strings or HTML.',
  schema: {
    type: 'object',
    properties: {
      type: { const: 'doc' },
      content: {
        type: 'array',
        items: { $ref: '#/$defs/node' },
      },
    },
    required: ['type', 'content'],
    additionalProperties: false,
    $defs: {
      node: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'paragraph',
              'heading',
              'text',
              'hardBreak',
              'blockquote',
              'codeBlock',
              'bulletList',
              'orderedList',
              'listItem',
            ],
          },
          attrs: { type: 'object' },
          text: { type: 'string' },
          marks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'bold',
                    'italic',
                    'underline',
                    'strike',
                    'subscript',
                    'superscript',
                    'link',
                  ],
                },
                attrs: { type: 'object' },
              },
              required: ['type'],
            },
          },
          content: {
            type: 'array',
            items: { $ref: '#/$defs/node' },
          },
        },
        required: ['type'],
      },
    },
  },
};

type RichtextFieldRenderProps = FieldProps<RichtextField, RichtextValue> & {
  name: string;
};

const RichtextFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
  name,
}: RichtextFieldRenderProps) => {
  console.log(field, value);

  return (
    <FieldLabel
      label={field.label ?? 'Richtext'}
      readOnly={readOnly}
    >
      <RichtextEditor
        value={value}
        onChange={({ json }) => onChange(json)}
      />
    </FieldLabel>
  );
};

export const richtextPlugin: Plugin<UserFieldsConfig> = {
  name: 'richtext',
  overrides: {
    fieldTypes: {
      richtext: RichtextFieldRender,
    },
  },
  fieldTransforms: {
    richtext: ({ value }) => value,
  },
};
