import { ArrayField } from '@puckeditor/core';
import { defaultFormOption, FormOption } from '@wepublish/puck-content/website';

export const formOptionsField = {
  type: 'array',
  label: 'Options',
  min: 1,
  arrayFields: {
    label: {
      type: 'text',
      label: 'Label',
    },
    value: {
      type: 'text',
      label: 'Submitted value',
    },
  },
  defaultItemProps: defaultFormOption,
  getItemSummary: (item: FormOption, index?: number) =>
    item.label || item.value || `Option ${(index ?? 0) + 1}`,
  ai: {
    instructions:
      'The choices the reader picks from. label is what readers see, value is what gets sent to the action URL; keep values short and unique, e.g. the Mailchimp group or merge field value.',
  },
} satisfies ArrayField<FormOption[]>;
