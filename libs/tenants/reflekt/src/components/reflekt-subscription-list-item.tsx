import styled from '@emotion/styled';
import {
  SubscriptionListItem,
  SubscriptionListItemActions,
} from '@wepublish/membership/website';

import theme from '../theme';

export const ReflektSubscriptionListItem = styled(SubscriptionListItem)`
  ${SubscriptionListItemActions} {
    .MuiButton-text.MuiButton-colorSecondary {
      color: ${theme.palette.text.primary};
    }
  }
`;
