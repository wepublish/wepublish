import styled from '@emotion/styled';
import { SubscribeBlock } from '@wepublish/block-content/website';
import { SubscribeAmount } from '@wepublish/membership/website';

export const OnlineReportsSubscribe = styled(SubscribeBlock)`
  ${SubscribeAmount} {
    background: ${({ theme }) => theme.palette.secondary.main};
  }
`;
