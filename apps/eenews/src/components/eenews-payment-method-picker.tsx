import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { BuilderPaymentMethodPickerProps } from '@wepublish/website/builder';

import { eenewsColors } from '../theme';

const Wrap = styled('div')`
  display: grid;
  gap: 12px;
`;

const Row = styled('label', {
  shouldForwardProp: p => p !== 'selected',
})<{ selected: boolean }>`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  padding: 18px 22px;
  border: 1.5px solid
    ${({ selected }) => (selected ? eenewsColors.accent : eenewsColors.line)};
  border-width: ${({ selected }) => (selected ? 2 : 1.5)}px;
  background: ${({ selected }) =>
    selected ? eenewsColors.bgAlt : eenewsColors.white};
  cursor: pointer;
  align-items: center;
`;

const Ic = styled('span')`
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: ${eenewsColors.accent};
  color: ${eenewsColors.white};
`;

const Radio = styled('span', {
  shouldForwardProp: p => p !== 'selected',
})<{ selected: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: ${({ selected }) => (selected ? 2 : 1.5)}px solid
    ${({ selected }) => (selected ? eenewsColors.accent : eenewsColors.line)};
  display: grid;
  place-items: center;
  &::after {
    content: '';
    width: 10px;
    height: 10px;
    background: ${({ selected }) =>
      selected ? eenewsColors.accent : 'transparent'};
    border-radius: 50%;
  }
`;

const HiddenInput = styled('input')`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

export const EenewsPaymentMethodPicker = ({
  className,
  paymentMethods,
  onChange,
  name,
  value,
}: BuilderPaymentMethodPickerProps) => {
  if (!paymentMethods?.length) {
    return null;
  }
  return (
    <Wrap className={className}>
      {paymentMethods.map(method => {
        const selected = value === method.id;
        return (
          <Row
            key={method.id}
            selected={selected}
          >
            <HiddenInput
              type="radio"
              name={name}
              value={method.id}
              checked={selected}
              onChange={() => onChange(method.id)}
            />
            <Ic>
              <Typography variant="btnDefault">
                {method.name.slice(0, 2).toUpperCase()}
              </Typography>
            </Ic>
            <div>
              <Typography variant="articleH2">{method.name}</Typography>
              {method.description && (
                <Typography variant="teaserMeta">
                  {method.description}
                </Typography>
              )}
            </div>
            <Radio selected={selected} />
          </Row>
        );
      })}
    </Wrap>
  );
};
