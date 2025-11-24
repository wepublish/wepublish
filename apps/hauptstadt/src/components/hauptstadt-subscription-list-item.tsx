import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  SubscriptionListItem,
  SubscriptionListItemPaymentPeriodicity,
} from '@wepublish/membership/website';
import { ProductType } from '@wepublish/website/api';

export const HauptstadtSubscriptionListItem = styled(SubscriptionListItem)`
  ${({ memberPlan: { productType } }) =>
    productType === ProductType.Donation &&
    css`
      ${SubscriptionListItemPaymentPeriodicity} {
        display: none;
      }
    `}
`;
