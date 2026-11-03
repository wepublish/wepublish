import { ComponentConfig } from '@puckeditor/core';
import { SubscribeBlockField } from '@wepublish/website/api';
import { z } from 'zod/v4';
import {
  SubscribeConfigProps,
  SubscribeRender,
} from '@wepublish/puck-content/website';
import { MdCardMembership } from 'react-icons/md';

import { editorRender } from '../../blocks/editor-render';
import { switchFieldAi } from '../../switch/switch.field';
import { tagFieldAi } from '../../tag/tag.field';
import { UserFields } from '../../fields';
import { withDataSource, WithDataSource } from '../../blocks/with-datasource';
import { decorateOwnForm } from '../form/form-editor-warning';

const subscribeFields = [
  SubscribeBlockField.FirstName,
  SubscribeBlockField.Birthday,
  SubscribeBlockField.Address,
  SubscribeBlockField.EmailRepeated,
  SubscribeBlockField.Password,
  SubscribeBlockField.PasswordRepeated,
];

export const SubscribeConfig: ComponentConfig<{
  props: WithDataSource<SubscribeConfigProps>;
  fields: UserFields;
}> = withDataSource<SubscribeConfigProps>(
  {
    icon: MdCardMembership,
    category: 'engagement',
    order: 1,
    nameKey: 'puck.blocks.names.Subscribe',
    ai: {
      instructions:
        'A membership subscription sign-up form that lets readers subscribe to a member plan. The fields array configures which extra input fields the form asks for (such as First name, Birthday or Address). The memberPlan datasource decides which member plans are offered: list offers every active member plan, multiple offers only the picked ones in display order. Use it on landing or paywall pages where you want visitors to become subscribers.',
    },
    fields: {
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
      fields: [],
      showGoodies: false,
      showDiscountCodes: false,
      goodieMinValueAppliesToUpgrade: false,
      hideRepeatGoodieOnUpgrade: false,
    },
    render: editorRender(SubscribeRender, { decorate: decorateOwnForm }),
  },
  {
    memberPlan: { type: 'list' },
  },
  {
    models: ['memberPlan'],
    types: ['list', 'multiple'],
    label: 'Member plans',
  }
);
