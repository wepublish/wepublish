import styled from '@emotion/styled';
import { RichTextBlockWrapper } from '@wepublish/block-content/website';
import {
  MemberPlanPicker,
  MemberPlanPickerRadios,
} from '@wepublish/membership/website';
import { useSubscriptionsQuery } from '@wepublish/website/api';
import {
  BuilderMemberPlanPickerProps,
  BuilderRouterContext,
} from '@wepublish/website/builder';
import { forwardRef, useContext } from 'react';

export const StyledMemberPlanPicker = styled(MemberPlanPicker)`
  display: grid;

  ${MemberPlanPickerRadios} {
    grid-template-columns: repeat(2, 1fr);

    label {
      display: contents;
    }

    ${({ theme }) => theme.breakpoints.up('sm')} {
      display: grid;
      grid-template-columns: none;
      grid-auto-flow: column;
      grid-auto-columns: calc((100% - 3 * 1rem) / 4);
      justify-content: center;
      gap: 1rem;
    }
  }

  ${RichTextBlockWrapper} {
    display: none;
  }
`;

export const ReflektMemberPlanPicker = forwardRef<
  HTMLButtonElement,
  BuilderMemberPlanPickerProps
>(function SortedMemberPlanPicker(props, ref) {
  const {
    query: { upgradeSubscriptionId },
  } = useContext(BuilderRouterContext);
  const { data } = useSubscriptionsQuery({
    fetchPolicy: 'cache-only',
    skip: !upgradeSubscriptionId,
  });
  const isUpgrade = !!data?.userSubscriptions.some(
    subscription =>
      subscription.isActive && subscription.id === upgradeSubscriptionId
  );

  return (
    <div id="MemberPlans">
      <StyledMemberPlanPicker
        {...props}
        alwaysShow={isUpgrade}
        ref={ref}
      />
    </div>
  );
});
