import { ComponentConfig } from '@puckeditor/core';
import { FormHiddenProps } from '@wepublish/puck-content/website';
import { MdVisibilityOff } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';
import { formFieldNameField } from '../form-field-fields';
import { decorateFormField } from '../form-editor-warning';
import {
  FormHiddenEditorExtra,
  FormHiddenEditorRender,
} from './form-hidden-placeholder.component';

const editorPlaceholder: FormHiddenEditorExtra = { placeholder: true };

export const FormHiddenConfig: ComponentConfig<{
  props: FormHiddenProps;
  fields: UserFields;
}> = {
  label: 'Hidden field',
  icon: MdVisibilityOff,
  category: 'form',
  group: 'formFields',
  order: 6,
  nameKey: 'puck.blocks.names.FormHidden',
  ai: {
    instructions:
      'An invisible input placed inside a Form that always sends a fixed value under name, e.g. a SOURCE or campaign tag for Mailchimp. Readers never see it.',
  },
  fields: {
    name: formFieldNameField,
    value: {
      type: 'text',
      label: 'Value',
      ai: {
        instructions: 'The fixed value that is always sent, e.g. website.',
      },
    },
  },
  defaultProps: {
    name: 'SOURCE',
    value: 'website',
  },
  render: editorRender(FormHiddenEditorRender, {
    useExtra: () => editorPlaceholder,
    decorate: decorateFormField,
  }),
};
