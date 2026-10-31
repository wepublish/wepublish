import { SubscribeBlockProvider } from '@wepublish/block-content/website';
import {
  BuilderSubscribeBlockProps,
  SubscribeBlock,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

import { PuckBlockComponent } from '../../blocks/block.types';
import { OutsideFormOnly } from '../form/outside-form-only.component';

export type SubscribeConfigProps = Omit<
  BuilderSubscribeBlockProps,
  'memberPlans' | 'memberPlanIds' | 'memberPlanRenderSettings' | 'className'
>;

const noMemberPlans: BuilderSubscribeBlockProps['memberPlans'] = [];

const noRenderSettings: BuilderSubscribeBlockProps['memberPlanRenderSettings'] =
  [];

export const SubscribeRender: PuckBlockComponent<SubscribeConfigProps> = ({
  className,
  props,
  data,
}) => {
  const memberPlans = data.memberPlans ?? noMemberPlans;
  const memberPlanIds = useMemo(
    () => memberPlans.map(plan => plan.id),
    [memberPlans]
  );

  return (
    <OutsideFormOnly>
      <SubscribeBlockProvider>
        <SubscribeBlock
          {...props}
          className={className}
          memberPlans={memberPlans}
          memberPlanIds={memberPlanIds}
          memberPlanRenderSettings={noRenderSettings}
        />
      </SubscribeBlockProvider>
    </OutsideFormOnly>
  );
};
