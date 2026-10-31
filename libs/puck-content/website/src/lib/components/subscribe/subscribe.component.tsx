import { PuckComponent } from '@puckeditor/core';
import { SubscribeBlockProvider } from '@wepublish/block-content/website';
import {
  BuilderSubscribeBlockProps,
  SubscribeBlock,
} from '@wepublish/website/builder';

import { datasourceIds } from '@wepublish/puck-content/editor';
import { OutsideFormOnly } from '../form/outside-form-only.component';
import { WithDataSource } from '../with-datasource';
import { useSubscribeMemberPlans } from './subscribe-member-plans';

export type SubscribeConfigProps = WithDataSource<BuilderSubscribeBlockProps>;

const SubscribeContent: PuckComponent<SubscribeConfigProps> = ({
  datasources,
  ...props
}) => {
  const memberPlans = useSubscribeMemberPlans(
    datasourceIds(datasources, 'memberPlan')
  );

  return (
    <SubscribeBlockProvider>
      <SubscribeBlock
        {...props}
        memberPlans={memberPlans}
      />
    </SubscribeBlockProvider>
  );
};

export const SubscribeRender: PuckComponent<SubscribeConfigProps> = props => (
  <OutsideFormOnly isEditing={props.puck.isEditing}>
    <SubscribeContent {...props} />
  </OutsideFormOnly>
);
