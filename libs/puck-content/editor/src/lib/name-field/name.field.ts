import { CustomField } from '@puckeditor/core';
import { createElement } from 'react';

import { NameInput } from './name.component';

export const nameField = (label: string): CustomField<string | undefined> => ({
  type: 'custom',
  label,
  render: props => createElement(NameInput, props),
});
