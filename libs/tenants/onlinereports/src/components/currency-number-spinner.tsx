import { NumberField } from '@base-ui-components/react/number-field';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { SvgIcon, Theme } from '@mui/material';
import { ComponentProps, useId } from 'react';

const MinusIcon = (props: ComponentProps<'svg'>) => {
  return (
    <SvgIcon>
      <path
        d="M0 0h24v24H0z"
        fill="none"
      />
      <path d="M19 13H5v-2h14v2z" />
    </SvgIcon>
  );
};

const PlusIcon = (props: ComponentProps<'svg'>) => {
  return (
    <SvgIcon>
      <path
        d="M0 0h24v24H0z"
        fill="none"
      />
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </SvgIcon>
  );
};

const rootStyles = (theme: Theme) => css`
  display: inline-flex;
  flex-direction: column;
  position: relative;
  margin: 0;
  padding: 0;
  border: 0;
  vertical-align: middle;
  width: auto;
  background-color: white;
  border-radius: ${theme.shape.borderRadius}px;

  &:hover {
    ${FieldSet} {
      border-color: rgba(0, 0, 0, 0.7);
    }
  }
`;

const groupStyles = (theme: Theme) => css`
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.4375em;
  letter-spacing: 0.00938em;
  color: rgba(0, 0, 0, 0.54);
  box-sizing: border-box;
  cursor: text;
  display: inline-flex;
  align-items: center;
  position: relative;
  border-radius: ${theme.shape.borderRadius}px;
  padding-left: 14px;
  padding-right: 14px;
`;

const buttonStyles = (theme: Theme) => css`
  position: relative;
  box-sizing: border-box;
  background-color: transparent;
  outline: 0px;
  border: 0px;
  margin: 0px 0px 0px -0.25rem;
  padding: 0px;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
  appearance: none;
  text-decoration: none;
  color: inherit;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: calc(2 * ${theme.shape.borderRadius}px);
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  overflow: hidden;

  &[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (hover: hover) {
    &:hover:not([disabled]) {
      color: rgba(0, 0, 0, 0.87);
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
`;

const iconStyles = () => css`
  user-select: none;
  width: 1em;
  height: 1em;
  display: inline-block;
  flex-shrink: 0;
  transition: fill 300ms cubic-bezier(0.4, 0, 0.2, 1);
  fill: currentcolor;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
  white-space: nowrap;

  & * {
    fill: currentcolor;
  }
`;

const inputStyles = () => css`
  font: inherit;
  letter-spacing: inherit;
  color: currentcolor;
  border: 0px;
  box-sizing: content-box;
  background: none;
  height: 1.4375em;
  margin: 0 0 0 40px;
  display: block;
  min-width: 0px;
  width: 100%;
  animation-name: mui-auto-fill-cancel;
  animation-duration: 10ms;
  padding: 16.5px 0px;

  &::placeholder {
    color: currentcolor;
    opacity: 1;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  &:focus {
    outline: none;
  }
`;

const FieldSet = styled('fieldset')`
  text-align: left;
  position: absolute;
  inset: -5px 0px 0px;
  margin: 0px;
  padding: 0px 8px;
  pointer-events: none;
  border-style: solid;
  border-width: 1px;
  border-color: rgba(0, 0, 0, 0.35);
  border-width: 1px;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  overflow: hidden;
  box-sizing: inherit;
  font-weight: 400;
  font-size: 1rem;
  color: ${({ theme }) => theme.palette.text.primary};
  cursor: text;
  background-color: transparent;
  line-height: 23px;
  margin: 0;
  padding: 0 8px;
  min-width: 0%;
  position: absolute;
  tab-size: 4;
  text-align: left;
  right: 0px;
  left: 0px;
  top: 0px;
  bottom: 0px;

  &:focus-visible {
    outline: auto;
  }
`;

const CurrencyLabel = styled('div')`
  text-align: left;
  margin: 0px;
  padding: 0px 0 0 25px;
  pointer-events: none;
  width: 40px;
  flex-shrink: 0;
  text-wrap: nowrap;
`;

type CurrencyNumberSpinnerProps = ComponentProps<typeof NumberField.Root>;

export const CurrencyNumberSpinner = (
  props: CurrencyNumberSpinnerProps & { currency?: string }
) => {
  const id = useId();
  const { onValueChange, defaultValue, min, step, currency = 'CHF' } = props;

  return (
    <NumberField.Root
      id={id}
      defaultValue={defaultValue ?? 0}
      css={rootStyles}
      min={min ?? 0}
      step={step ?? 1}
      onValueChange={
        onValueChange ?
          (
            value: number | null,
            eventDetails: NumberField.Root.ChangeEventDetails
          ) => onValueChange(value, eventDetails)
        : undefined
      }
    >
      <NumberField.Group css={groupStyles}>
        <NumberField.Decrement css={buttonStyles}>
          <MinusIcon css={iconStyles} />
        </NumberField.Decrement>

        <CurrencyLabel>{currency}</CurrencyLabel>

        <NumberField.Input css={inputStyles} />

        <NumberField.Increment css={buttonStyles}>
          <PlusIcon css={iconStyles} />
        </NumberField.Increment>
      </NumberField.Group>

      <FieldSet />
    </NumberField.Root>
  );
};
