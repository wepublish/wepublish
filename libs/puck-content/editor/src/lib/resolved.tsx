import { BaseField, FieldProps, Plugin } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';

import { UserFieldsConfig } from './fields';

export type ResolvedValue = unknown;

export type ResolvedField = BaseField & {
  type: 'resolved';
};

export const resolvedFieldAi: FieldAiParams = {
  exclude: true,
};

type ResolvedFieldRenderProps = FieldProps<ResolvedField, ResolvedValue> & {
  name: string;
};

export const resolvedPlugin: Plugin<UserFieldsConfig> = {
  name: 'resolved',
  overrides: {
    fieldTypes: {
      resolved: (props: ResolvedFieldRenderProps) => <></>,
    },
  },
};
