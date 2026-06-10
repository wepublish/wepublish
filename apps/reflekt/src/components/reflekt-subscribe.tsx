import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { SubscribeBlock } from '@wepublish/block-content/website';
import {
  PaymentRadioWrapper,
  Subscribe,
  SubscribeButton,
  SubscribeCancelable,
  SubscribeNarrowSection,
  SubscribePayment,
  SubscribeSection,
  TransactionFeeIcon,
  TransactionFeeWrapper,
} from '@wepublish/membership/website';

import { buttonLinkSecondaryStyles } from '../theme';

export const ReflektSubscribeForm = styled(Subscribe)`
  background-color: orange;
`;
export const ReflektSubscribe = styled(SubscribeBlock)`
  background-color: transparent;
  grid-template-columns: 1fr;
  grid-template-areas:
    'memberPlans'
    'monthlyAmount'
    'userForm'
    'transactionFee'
    'submit'
    'paymentPeriodicity'
    'challenge';

  ${SubscribeSection},
  ${SubscribeNarrowSection} {
    grid-area: var(--grid-area);

    > h2 {
      display: none;
    }
  }

  ${SubscribeSection}[data-area='returning'],
  ${SubscribeNarrowSection}[data-area='voucher'] {
    display: none;
  }

  ${SubscribeSection}[data-area='paymentPeriodicity'] ${PaymentRadioWrapper} {
    outline: none;
    border: none;
  }

  ${SubscribeSection}[data-area='paymentPeriodicity'] ${SubscribePayment} {
    justify-content: center;
  }

  ${SubscribeButton} {
    ${css(buttonLinkSecondaryStyles)}
  }

  ${TransactionFeeWrapper} {
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    border-radius: 0;
    padding: ${({ theme }) => theme.spacing(1, 2)};
    border: none;
    width: 100%;
    justify-content: center;

    ${TransactionFeeIcon} {
      display: none;
    }

    .MuiCheckbox-root,
    .MuiCheckbox-root.Mui-checked {
      color: ${({ theme }) => theme.palette.common.white};
    }
  }

  ${SubscribeSection}[data-area='challenge'] > div > div {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  ${ReflektSubscribeForm} {
    background-color: transparent;
  }

  ${SubscribeCancelable} {
    margin-top: ${({ theme }) => theme.spacing(2)};
    white-space: pre-line;
    color: ${({ theme }) => theme.palette.common.black};
  }
`;
