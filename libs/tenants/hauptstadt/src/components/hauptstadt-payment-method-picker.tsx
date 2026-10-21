import styled from '@emotion/styled';
import {
  PaymentMethodPicker,
  PaymentRadioWrapper,
} from '@wepublish/membership/website';

export const HauptstadtPaymentMethodPicker = styled(PaymentMethodPicker)`
  ${PaymentRadioWrapper} {
    border-width: 2px;
    color: ${({ theme }) => theme.palette.primary.dark};
  }
`;
