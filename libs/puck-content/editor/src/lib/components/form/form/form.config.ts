import { ComponentConfig, Slot } from '@puckeditor/core';
import {
  FormEncType,
  FormExtra,
  FormInputProps,
  FormMethod,
  FormProps,
  FormRender,
  FormSubmitProps,
  FormTarget,
} from '@wepublish/puck-content/website';
import { FormEvent } from 'react';

import { editorRender } from '../../../blocks/editor-render';
import { ToPuckSlots } from '../../../blocks/puck-editor-props';
import { Components } from '../../../config.types';
import { UserFields } from '../../../fields';
import { FormComponentName } from '../form-components';
import { decorateForm } from '../form-editor-warning';
import { FormInputConfig } from '../form-input/form-input.config';
import { FormSubmitConfig } from '../form-submit/form-submit.config';

const methodOptions: { label: string; value: FormMethod }[] = [
  { label: 'POST', value: 'post' },
  { label: 'GET', value: 'get' },
];

const targetOptions: { label: string; value: FormTarget }[] = [
  { label: 'Same tab', value: '_self' },
  { label: 'New tab', value: '_blank' },
];

const encTypeOptions: { label: string; value: FormEncType }[] = [
  { label: 'URL encoded', value: 'application/x-www-form-urlencoded' },
  { label: 'Multipart', value: 'multipart/form-data' },
];

const disallowedContent: (keyof Components)[] = [
  'Form',
  'MailchimpForm',
  'Subscribe',
];

const mailchimpEmailInput: FormInputProps = {
  ...FormInputConfig.defaultProps,
  name: 'EMAIL',
  label: 'Email',
  type: 'email',
  required: true,
  autoComplete: 'email',
};

const mailchimpSubmit: FormSubmitProps = {
  ...FormSubmitConfig.defaultProps,
  label: 'Subscribe',
};

const editorFormExtra: FormExtra = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => event.preventDefault(),
};

const mailchimpStarterContent: Slot = [
  {
    type: 'FormInput' satisfies FormComponentName,
    props: mailchimpEmailInput,
  },
  {
    type: 'FormSubmit' satisfies FormComponentName,
    props: mailchimpSubmit,
  },
];

export const FormConfig: ComponentConfig<{
  props: ToPuckSlots<FormProps>;
  fields: UserFields;
}> = {
  label: 'Form',
  ai: {
    instructions:
      'Wraps inputs and a submit button into a plain HTML form that the browser sends to the action URL, without any JavaScript. For Mailchimp, set action to the embedded form URL (https://<dc>.list-manage.com/subscribe/post?u=…&id=…), method post, name the inputs EMAIL, FNAME and LNAME, and set honeypot to the b_<u>_<id> name from the embed code. Forms cannot be nested, and MailchimpForm and Subscribe bring their own form, so never place them inside a Form, not even inside a layout block within it.',
  },
  fields: {
    action: {
      type: 'text',
      label: 'Action URL',
      placeholder: 'https://…',
      ai: {
        instructions:
          'Absolute URL the form data is sent to, e.g. the Mailchimp embedded form URL. Never invent one; leave it empty when unknown.',
      },
    },
    method: {
      type: 'radio',
      label: 'Method',
      options: methodOptions,
      ai: {
        instructions:
          'post for sign-ups and anything that changes data (Mailchimp needs post), get only for searches.',
      },
    },
    target: {
      type: 'radio',
      label: 'Open response in',
      options: targetOptions,
    },
    encType: {
      type: 'select',
      label: 'Encoding',
      options: encTypeOptions,
      ai: {
        instructions:
          'Keep URL encoded unless the receiving service asks for multipart.',
      },
    },
    honeypot: {
      type: 'text',
      label: 'Spam trap field name',
      ai: {
        instructions:
          'Name of an invisible field that only bots fill in, e.g. the Mailchimp b_<u>_<id> name from the embed code. Leave empty when the service has none.',
      },
    },
    content: {
      type: 'slot',
      disallow: disallowedContent,
    },
  },
  defaultProps: {
    action: '',
    method: 'post',
    target: '_self',
    encType: 'application/x-www-form-urlencoded',
    honeypot: '',
    content: mailchimpStarterContent,
  },
  render: editorRender(FormRender, {
    minEmptyHeight: 120,
    useExtra: () => editorFormExtra,
    decorate: decorateForm,
  }),
};
