import { ComponentConfig } from '@puckeditor/core';
import {
  SubscribeBlock,
  SubscribeBlockProvider,
} from '@wepublish/block-content/website';
import { SubscribeBlockField } from '@wepublish/website/api';
import { BuilderSubscribeBlockProps } from '@wepublish/website/builder';

import {
  DatasourceValueType,
  resolvedFieldAi,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../types';
import { withDataSource } from './with-datasource';

export type SubscribeConfigProps = Omit<
  BuilderSubscribeBlockProps,
  'fields'
> & {
  fields: { field?: SubscribeBlockField | undefined }[];
  datasource?: DatasourceValueType<'items'>;
};

export const SubscribeConfig: ComponentConfig<{
  props: SubscribeConfigProps;
  fields: UserFields;
}> = withDataSource(
  {
    ai: {
      instructions:
        'A membership subscription sign-up form that lets readers subscribe to a member plan. The fields array configures which extra input fields the form asks for (such as First name, Birthday or Address); member plans are loaded automatically. Use it on landing or paywall pages where you want visitors to become subscribers.',
    },
    fields: {
      memberPlans: {
        type: 'resolved',
        visible: false,
        ai: resolvedFieldAi,
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
    resolveData(data, params) {
      return {
        props: {
          memberPlans: [],
        },
      };
    },
    render: function Subscribe({ fields, ...props }) {
      return (
        <SubscribeBlockProvider>
          <SubscribeBlock
            {...props}
            fields={fields.flatMap(field => field.field ?? [])}
          />
        </SubscribeBlockProvider>
      );
    },
  },
  {
    model: 'Memberplan',
    type: 'items',
  },
  {
    models: ['Memberplan'],
    types: ['items'],
    label: 'Memberplans',
  }
);
