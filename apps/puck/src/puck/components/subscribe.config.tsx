import { ComponentConfig } from '@puckeditor/core';
import {
  SubscribeBlock,
  SubscribeBlockProvider,
} from '@wepublish/block-content/website';
import {
  SubscribeBlockField,
  useMemberPlanListQuery,
} from '@wepublish/website/api';
import { BuilderSubscribeBlockProps } from '@wepublish/website/builder';

import { DatasourceValueType } from '../plugins/datasource';
import { UserFields } from '../types';

export type SubscribeConfigProps = Omit<
  BuilderSubscribeBlockProps,
  'memberPlans' | 'fields'
> & {
  fields: { field?: SubscribeBlockField | undefined }[];
  datasource?: DatasourceValueType<'items'>;
};

export const SubscribeConfig: ComponentConfig<{
  props: SubscribeConfigProps;
  fields: UserFields;
}> = {
  fields: {
    datasource: {
      type: 'datasource',
      models: ['Memberplan'],
      types: ['items'],
      label: 'Memberplans',
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
    fields: [],
    datasource: {
      model: 'Memberplan',
      type: 'items',
    },
  },

  render: ({ fields, ...props }) => {
    const { data } = useMemberPlanListQuery({
      variables: {
        take: 100,
      },
    });
    const memberPlans = (data?.memberPlans.nodes ?? []).filter(
      mb =>
        !props.datasource?.ids || (props.datasource?.ids ?? []).includes(mb.id)
    );

    return (
      <SubscribeBlockProvider>
        <SubscribeBlock
          memberPlans={memberPlans}
          fields={fields.flatMap(field => field.field ?? [])}
          {...props}
        />
      </SubscribeBlockProvider>
    );
  },
};
