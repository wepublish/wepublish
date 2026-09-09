import { ComponentConfig } from '@puckeditor/core';
import { SubscribeBlockField } from '@wepublish/website/api';
import { z } from 'zod/v4';

import { listFieldAi, resolvedFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../types';
import { SubscribeConfigProps, SubscribeRender } from './subscribe.component';
import { withDataSource } from './with-datasource';

const subscribeFields = [
  SubscribeBlockField.FirstName,
  SubscribeBlockField.Birthday,
  SubscribeBlockField.Address,
  SubscribeBlockField.EmailRepeated,
  SubscribeBlockField.Password,
  SubscribeBlockField.PasswordRepeated,
];

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
        type: 'list',
        defaultItem: SubscribeBlockField.FirstName,
        itemField: {
          type: 'select',
          options: subscribeFields.map(field => ({
            label: field,
            value: field,
          })),
        },
        ai: listFieldAi(
          z.enum(subscribeFields),
          'Extra input fields the sign-up form asks for, in display order.'
        ),
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
    render: SubscribeRender,
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
