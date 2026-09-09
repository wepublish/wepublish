import { ComponentConfig } from '@puckeditor/core';
import { z } from 'zod/v4';

import {
  colorFieldAi,
  listFieldAi,
  switchFieldAi,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import {
  MailchimpFormConfigProps,
  MailchimpFormRender,
} from './mailchimp-form.component';

const inputTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'tel' },
  { label: 'Number', value: 'number' },
  { label: 'Hidden', value: 'hidden' },
  { label: 'Interest groups', value: 'groups' },
];

const defaultInput = {
  inputType: 'text',
  name: '',
  label: '',
  description: '',
  required: false,
  urlParam: '',
  defaultValue: '',
  value: '',
  options: [],
};

const defaultStep = {
  skipIfFieldsFilled: [],
  skipIfInterestsFilled: [],
  showIfInterestsFilled: [],
  inputs: [
    { ...defaultInput, inputType: 'email', name: 'EMAIL', label: 'Email' },
  ],
};

const idList = (instructions: string) => listFieldAi(z.string(), instructions);

export const MailchimpFormConfig: ComponentConfig<{
  props: MailchimpFormConfigProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A newsletter sign-up form that adds the reader to a Mailchimp audience. listId is the Mailchimp audience id and syncProviderId the configured Mailchimp integration. The form is split into steps, each with its own inputs; input names are Mailchimp merge field names such as EMAIL or FNAME. interests preselects interest group ids. Use it where readers should subscribe to a newsletter.',
  },
  fields: {
    syncProviderId: {
      type: 'text',
      label: 'Sync provider',
      ai: {
        instructions:
          'Identifier of the configured Mailchimp integration. Keep the existing value and never invent one.',
      },
    },
    listId: {
      type: 'text',
      label: 'Audience ID',
      ai: {
        instructions:
          'Mailchimp audience (list) id. Keep the existing value and never invent one.',
      },
    },
    interests: {
      type: 'list',
      label: 'Preselected interests',
      itemField: { type: 'text' },
      defaultItem: '',
      ai: idList('Mailchimp interest group ids every subscriber is added to.'),
    },
    autoFocus: {
      type: 'switch',
      label: 'Focus first input',
      ai: switchFieldAi(
        'Whether the first input is focused when the page loads.'
      ),
    },
    doubleOptIn: {
      type: 'switch',
      label: 'Double opt-in',
      ai: switchFieldAi(
        'Whether subscribers must confirm their address via email before being added.'
      ),
    },
    submitButtonLabel: {
      type: 'text',
      label: 'Button label',
      ai: { instructions: 'Label of the submit button, e.g. "Subscribe".' },
    },
    buttonColor: {
      type: 'color',
      label: 'Button color',
      ai: colorFieldAi(),
    },
    buttonFontColor: {
      type: 'color',
      label: 'Button text color',
      ai: colorFieldAi(),
    },
    successUrl: {
      type: 'text',
      label: 'Success URL',
      ai: {
        instructions:
          'URL the reader is redirected to after subscribing. Leave empty to show the success page instead. Merge fields can be inserted as |*FIELD*|.',
      },
    },
    steps: {
      type: 'array',
      label: 'Steps',
      min: 1,
      getItemSummary: (_item, index = 0) => `Step ${index + 1}`,
      defaultItemProps: defaultStep,
      arrayFields: {
        inputs: {
          type: 'array',
          label: 'Inputs',
          getItemSummary: item => item.label || item.name || 'Input',
          defaultItemProps: defaultInput,
          arrayFields: {
            inputType: {
              type: 'select',
              label: 'Type',
              options: inputTypes,
              ai: {
                instructions:
                  'Kind of input: text, email, tel, number, hidden (not shown, submits value) or groups (interest group checkboxes from options).',
              },
            },
            name: {
              type: 'text',
              label: 'Merge field',
              ai: {
                instructions:
                  'Mailchimp merge field name in upper case, e.g. EMAIL, FNAME, LNAME.',
              },
            },
            label: {
              type: 'text',
              label: 'Label',
            },
            description: {
              type: 'textarea',
              label: 'Description',
            },
            required: {
              type: 'switch',
              label: 'Required',
              ai: switchFieldAi('Whether the input must be filled in.'),
            },
            urlParam: {
              type: 'text',
              label: 'URL parameter',
              ai: {
                instructions:
                  'Query parameter that prefills the input, e.g. "email" for ?email=…',
              },
            },
            defaultValue: {
              type: 'text',
              label: 'Default value',
            },
            value: {
              type: 'text',
              label: 'Fixed value',
              ai: {
                instructions:
                  'Fixed value submitted for this input, mainly for hidden inputs.',
              },
            },
            options: {
              type: 'array',
              label: 'Interest options',
              getItemSummary: item => item.name || 'Option',
              defaultItemProps: { id: '', name: '', description: '' },
              arrayFields: {
                id: {
                  type: 'text',
                  label: 'Interest ID',
                  ai: {
                    instructions:
                      'Mailchimp interest group id. Keep the existing value and never invent one.',
                  },
                },
                name: {
                  type: 'text',
                  label: 'Name',
                },
                description: {
                  type: 'textarea',
                  label: 'Description',
                },
              },
              ai: {
                instructions:
                  'Interest group checkboxes, only used for inputs of type groups.',
              },
            },
          },
        },
        skipIfFieldsFilled: {
          type: 'list',
          label: 'Skip if fields filled',
          itemField: { type: 'text' },
          defaultItem: '',
          ai: idList(
            'Merge field names; the step is skipped when all of them are already filled.'
          ),
        },
        skipIfInterestsFilled: {
          type: 'list',
          label: 'Skip if interests chosen',
          itemField: { type: 'text' },
          defaultItem: '',
          ai: idList(
            'Interest group ids; the step is skipped when the reader already chose them.'
          ),
        },
        showIfInterestsFilled: {
          type: 'list',
          label: 'Show only if interests chosen',
          itemField: { type: 'text' },
          defaultItem: '',
          ai: idList(
            'Interest group ids; the step is only shown when the reader chose them.'
          ),
        },
      },
    },
    successPage: {
      type: 'object',
      label: 'Success page',
      objectFields: {
        description: {
          type: 'textarea',
          label: 'Message',
          ai: {
            instructions: 'Thank-you message shown after subscribing.',
          },
        },
        options: {
          type: 'array',
          label: 'Links',
          getItemSummary: item => item.label || 'Link',
          defaultItemProps: {
            label: '',
            background: '',
            url: '',
            mergeFieldName: '',
            mergeFieldValue: '',
          },
          arrayFields: {
            label: {
              type: 'text',
              label: 'Label',
            },
            url: {
              type: 'text',
              label: 'URL',
            },
            background: {
              type: 'text',
              label: 'Background image URL',
            },
            mergeFieldName: {
              type: 'text',
              label: 'Merge field',
              ai: {
                instructions:
                  'Optional merge field updated when the link is clicked.',
              },
            },
            mergeFieldValue: {
              type: 'text',
              label: 'Merge field value',
            },
          },
        },
      },
    },
  },
  defaultProps: {
    interests: [],
    autoFocus: false,
    doubleOptIn: false,
    submitButtonLabel: 'Subscribe',
    steps: [defaultStep],
  },

  render: MailchimpFormRender,
};
