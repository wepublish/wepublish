import styled from '@emotion/styled';
import { alpha } from '@mui/material';
import { SubscribeBlock } from '@wepublish/block-content/website';
import {
  SubscribeAmount,
  SubscribeAmountText,
  SubscribeButton,
  SubscribeCancelable,
  SubscribeContinuation,
  SubscribeNarrowSection,
  SubscribePayment,
  SubscribeSection,
  SubscribeWrapper,
} from '@wepublish/membership/website';
import { BuilderSubscribeBlockProps } from '@wepublish/website/builder';

import { courantTokens } from '../brand-tokens';

const { pageGap } = courantTokens.layout;
const { colors, shape, typography } = courantTokens;

const CourantSubscribeBlockWrapper = styled('section')`
  display: grid;
  row-gap: ${({ theme }) => theme.spacing(pageGap.xs)};

  ${SubscribeWrapper} {
    gap: ${({ theme }) => theme.spacing(6)};
  }

  ${SubscribeSection} {
    gap: ${({ theme }) => theme.spacing(3)};
  }

  ${SubscribeNarrowSection} {
    gap: ${({ theme }) => theme.spacing(2)};
  }

  ${SubscribeAmount} {
    border-radius: 0;
    border: none;
    padding: ${({ theme }) => theme.spacing(8)};
    background-color: ${colors.warmGray[50]};
  }

  ${SubscribeAmountText} {
    font-family: var(--courant-display);
    font-size: ${typography.headings.page.h4};
  }

  ${SubscribePayment} {
    gap: ${({ theme }) => theme.spacing(4)};
  }

  ${SubscribeButton} {
    font-weight: 500;
    text-transform: none;
    font-size: ${typography.sizes.button};
  }

  ${SubscribeCancelable},
  ${SubscribeContinuation} {
    color: ${colors.warmGray[700]};
  }

  ${SubscribeSection}[data-area='memberPlans'] {
    p {
      text-align: center;
    }
  }

  /* We intentionally hide the fee contribution section for Courant */
  ${SubscribeSection}[data-area='transactionFee'] {
    display: none;
  }

  ${SubscribeSection}[data-area='paymentPeriodicity'] {
    gap: ${({ theme }) => theme.spacing(6)};
    justify-items: center;
    & > .MuiTypography-h5 {
      font-family: var(--courant-sans);
      font-size: ${typography.sizes.body1};
      margin: 0;
      text-align: center;
    }

    .MuiRadioGroup-root {
      gap: ${({ theme }) => theme.spacing(1)};
    }
    .MuiOutlinedInput-root {
      border-radius: ${shape.buttonRadius};
    }
    ${SubscribePayment} > .MuiFormControlLabel-root {
      margin: 0;
    }
  }

  ${SubscribeSection}[data-area='monthlyAmount'] {
    .MuiSlider-root {
      color: black;
    }

    .MuiSlider-rail {
      background-color: ${colors.warmGray[200]};
      opacity: 1;
      height: 10px;
    }

    .MuiSlider-track {
      background-color: ${colors.courant[500]};
      border: none;
      height: 10px;
    }

    .MuiSlider-thumb {
      background-color: ${colors.courant[500]};
      border: 2px solid ${colors.courant[600]};

      &:hover,
      &.Mui-focusVisible {
        box-shadow: 0 0 0 8px ${alpha(colors.courant[500], 0.16)};
      }

      &.Mui-active {
        box-shadow: 0 0 0 12px ${alpha(colors.courant[500], 0.24)};
      }
    }

    .MuiSlider-valueLabel {
      background-color: ${colors.black};
      color: ${({ theme }) => theme.palette.common.white};
    }
  }
`;

export const CourantSubscribeBlock = (props: BuilderSubscribeBlockProps) => {
  return (
    <CourantSubscribeBlockWrapper className={props.className}>
      <SubscribeBlock
        {...props}
        className={undefined}
      />
    </CourantSubscribeBlockWrapper>
  );
};
