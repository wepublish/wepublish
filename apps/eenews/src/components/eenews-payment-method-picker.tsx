import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { BuilderPaymentMethodPickerProps } from '@wepublish/website/builder';

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
    ${({ theme, selected }) =>
      selected ? theme.palette.primary.main : theme.palette.divider};
  border-width: ${({ selected }) => (selected ? 2 : 1.5)}px;
  background: ${({ theme, selected }) =>
    selected ? theme.palette.background.alt : theme.palette.background.paper};
  cursor: pointer;
  align-items: center;
`;

const Ic = styled('span')`
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.background.paper};
`;

const Radio = styled('span', {
  shouldForwardProp: p => p !== 'selected',
})<{ selected: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: ${({ selected }) => (selected ? 2 : 1.5)}px solid
    ${({ theme, selected }) =>
      selected ? theme.palette.primary.main : theme.palette.divider};
  display: grid;
  place-items: center;
  &::after {
    content: '';
    width: 10px;
    height: 10px;
    background: ${({ theme, selected }) =>
      selected ? theme.palette.primary.main : 'transparent'};
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
