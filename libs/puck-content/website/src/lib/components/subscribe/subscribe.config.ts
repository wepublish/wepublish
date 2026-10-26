import { ComponentConfig } from '@puckeditor/core';
import { SubscribeBlockField } from '@wepublish/website/api';
import { z } from 'zod/v4';

import {
  resolvedFieldAi,
  switchFieldAi,
  tagFieldAi,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { SubscribeConfigProps, SubscribeRender } from './subscribe.component';
import { withDataSource } from '../with-datasource';

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
}> = withDataSource<SubscribeConfigProps>(
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
      memberPlanIds: {
        type: 'resolved',
        visible: false,
        ai: resolvedFieldAi,
      },
      memberPlanRenderSettings: {
        type: 'resolved',
        visible: false,
        ai: resolvedFieldAi,
      },
      fields: {
        type: 'tag',
        itemField: {
          type: 'select',
          options: subscribeFields.map(field => ({
            label: field,
            value: field,
          })),
        },
        ai: tagFieldAi(
          z.enum(subscribeFields),
          'Extra input fields the sign-up form asks for.'
        ),
      },
      showGoodies: {
        type: 'switch',
        label: 'Show goodies',
        ai: switchFieldAi('Whether the form offers goodies with a plan.'),
      },
      showDiscountCodes: {
        type: 'switch',
        label: 'Show discount codes',
        ai: switchFieldAi('Whether the form accepts discount codes.'),
      },
      goodieMinValueAppliesToUpgrade: {
        type: 'switch',
        label: 'Goodie minimum applies to upgrades',
        ai: switchFieldAi(
          'Whether the minimum value for goodies also applies to upgrades.'
        ),
      },
      hideRepeatGoodieOnUpgrade: {
        type: 'switch',
        label: 'Hide repeated goodie on upgrade',
        ai: switchFieldAi(
          'Whether a goodie the reader already received is hidden when upgrading.'
        ),
      },
    },
    defaultProps: {
      memberPlans: [],
      memberPlanIds: [],
      memberPlanRenderSettings: [],
      fields: [],
      showGoodies: false,
      showDiscountCodes: false,
      goodieMinValueAppliesToUpgrade: false,
      hideRepeatGoodieOnUpgrade: false,
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
