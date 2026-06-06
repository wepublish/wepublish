import { ComponentConfig } from '@puckeditor/core';
import {
  SubscribeBlock,
  SubscribeBlockProvider,
} from '@wepublish/block-content/website';
import { SubscribeBlockField } from '@wepublish/website/api';
import { BuilderSubscribeBlockProps } from '@wepublish/website/builder';

export type SubscribeConfigProps = Omit<
  BuilderSubscribeBlockProps,
  'memberPlans' | 'fields'
> & {
  memberPlans: { memberPlan?: string }[];
  fields: { field?: SubscribeBlockField | undefined }[];
};

export const SubscribeConfig: ComponentConfig<SubscribeConfigProps> = {
  fields: {
    memberPlans: {
      type: 'array',
      min: 1,
      getItemSummary: item => item.memberPlan || 'Empty Memberplan',
      arrayFields: {
        memberPlan: {
          type: 'text',
        },
      },
      defaultItemProps: {},
    },
    fields: {
      type: 'array',
      getItemSummary: item => item.field ?? '',
      arrayFields: {
        field: {
          type: 'select',
          options: [
            {
              label: SubscribeBlockField.FirstName,
              value: SubscribeBlockField.FirstName,
            },
            {
              label: SubscribeBlockField.Birthday,
              value: SubscribeBlockField.Birthday,
            },
            {
              label: SubscribeBlockField.Address,
              value: SubscribeBlockField.Address,
            },
            {
              label: SubscribeBlockField.EmailRepeated,
              value: SubscribeBlockField.EmailRepeated,
            },
            {
              label: SubscribeBlockField.Password,
              value: SubscribeBlockField.Password,
            },
            {
              label: SubscribeBlockField.PasswordRepeated,
              value: SubscribeBlockField.PasswordRepeated,
            },
          ],
        },
      },
    },
  },
  defaultProps: {
    memberPlans: [],
    fields: [],
  },

  render: ({ memberPlans, fields, ...props }) => (
    <SubscribeBlockProvider>
      <SubscribeBlock
        memberPlans={[]}
        fields={fields.flatMap(field => field.field ?? [])}
        {...props}
      />
    </SubscribeBlockProvider>
  ),
};
