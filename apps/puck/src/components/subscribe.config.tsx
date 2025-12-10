import { ComponentConfig } from '@measured/puck';
import { BuilderSubscribeBlockProps } from '@wepublish/website/builder';
import {
  SubscribeBlock,
  SubscribeBlockProvider,
} from '@wepublish/block-content/website';
import { memberplanField } from '../fields/memberplan';
import {
  FullMemberPlanFragment,
  SubscribeBlockField,
} from '@wepublish/website/api';

export type SubscribeConfigProps = Omit<
  BuilderSubscribeBlockProps,
  'memberPlans' | 'fields'
> & {
  memberPlans: { memberPlan?: FullMemberPlanFragment | undefined }[];
  fields: { field?: SubscribeBlockField | undefined }[];
};

export const SubscribeConfig: ComponentConfig<SubscribeConfigProps> = {
  fields: {
    memberPlans: {
      type: 'array',
      min: 1,
      getItemSummary: item => item.memberPlan?.name ?? 'Empty Memberplan',
      arrayFields: {
        memberPlan: memberplanField,
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
  inline: true,
  render: ({ memberPlans, fields, ...props }) => (
    <SubscribeBlockProvider>
      <SubscribeBlock
        memberPlans={memberPlans.flatMap(
          memberPlan => memberPlan.memberPlan ?? []
        )}
        fields={fields.flatMap(field => field.field ?? [])}
        {...props}
      />
    </SubscribeBlockProvider>
  ),
};
