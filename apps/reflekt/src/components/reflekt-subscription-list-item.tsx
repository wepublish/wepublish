import styled from '@emotion/styled';
import {
  SubscriptionListItem,
  SubscriptionListItemActions,
} from '@wepublish/membership/website';

import theme from '../theme';

export const ReflektSubscriptionListItem = styled(SubscriptionListItem)`
  ${SubscriptionListItemActions} {
    .MuiButton-textSecondary {
      color: ${theme.palette.text.primary};
    }
  }
`;
