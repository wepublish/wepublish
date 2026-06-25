import { BaseField, FieldProps, Plugin } from '@puckeditor/core';

import { UserConfig } from '../types';

export type ResolvedValue = unknown;

export type ResolvedField = BaseField & {
  type: 'resolved';
};

type ResolvedFieldRenderProps = FieldProps<ResolvedField, ResolvedValue> & {
  name: string;
};

export const resolvedPlugin: Plugin<UserConfig> = {
  name: 'resolved',
  overrides: {
    fieldTypes: {
      resolved: (props: ResolvedFieldRenderProps) => <></>,
    },
  },
};
