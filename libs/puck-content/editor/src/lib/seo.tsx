import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';

import { UserFieldsConfig } from './fields';

export type SEOValue = {
  title?: string;
  lead?: string;
  imageId: string;
};

export type SEOField = BaseField & {
  type: 'seo';
};

export const seoFieldAi: FieldAiParams = {
  instructions:
    'Metadata shown to search engines and social media shares: title (max ~60 characters) and lead (description, max ~155 characters) summarising the page content. imageId references an already uploaded image — keep the existing value and never invent one.',
  schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Page title, at most about 60 characters',
      },
      lead: {
        type: 'string',
        description: 'Page description, at most about 155 characters',
      },
      imageId: {
        type: 'string',
        description: 'Id of an existing uploaded image, never invented',
      },
    },
    additionalProperties: false,
  },
};

type SEOFieldRenderProps = FieldProps<SEOField, SEOValue> & {
  name: string;
};

const SEOFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: SEOFieldRenderProps) => {
  const current = value ?? {};

  return (
    <FieldLabel
      label={field.label ?? 'SEO'}
      readOnly={readOnly}
    ></FieldLabel>
  );
};

export const seoPlugin: Plugin<UserFieldsConfig> = {
  name: 'seo',
  overrides: {
    fieldTypes: {
      seo: SEOFieldRender,
    },
  },
};
