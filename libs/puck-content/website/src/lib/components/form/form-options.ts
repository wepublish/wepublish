import { ArrayField } from '@puckeditor/core';

export type FormOption = {
  label: string;
  value: string;
};

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
  defaultItemProps: (index: number): FormOption => ({
    label: `Option ${index + 1}`,
    value: `option-${index + 1}`,
  }),
  getItemSummary: (item: FormOption, index?: number) =>
    item.label || item.value || `Option ${(index ?? 0) + 1}`,
  ai: {
    instructions:
      'The choices the reader picks from. label is what readers see, value is what gets sent to the action URL; keep values short and unique, e.g. the Mailchimp group or merge field value.',
  },
} satisfies ArrayField<FormOption[]>;

export const defaultFormOptions: FormOption[] = [
  formOptionsField.defaultItemProps(0),
  formOptionsField.defaultItemProps(1),
];
