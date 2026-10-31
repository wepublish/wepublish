import { BaseField, Plugin } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';

import { UserFieldsConfig } from './fields';

export type ResolvedValue = unknown;

export type ResolvedField = BaseField & {
  type: 'resolved';
};

export const resolvedFieldAi: FieldAiParams = {
  exclude: true,
};

// Resolved fields hold data that is loaded at render time, so there is
// nothing to edit
export const resolvedPlugin: Plugin<UserFieldsConfig> = {
  name: 'resolved',
  overrides: {
    fieldTypes: {
      resolved: () => null,
    },
  },
};
