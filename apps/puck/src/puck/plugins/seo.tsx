import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';

import { UserConfig } from '../types';

export type SEOValue = {
  title?: string;
  lead?: string;
  imageId: string;
};

export type SEOField = BaseField & {
  type: 'seo';
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

export const seoPlugin: Plugin<UserConfig> = {
  name: 'seo',
  overrides: {
    fieldTypes: {
      seo: SEOFieldRender,
    },
  },
};
