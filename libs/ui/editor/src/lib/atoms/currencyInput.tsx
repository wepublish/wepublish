import { useEffect, useState } from 'react';
import { Form, InputGroup } from 'rsuite';

export interface CurrencyInputProps {
  currency: string;
  centAmount: number | null;
  onChange(centAmount: number | null): void;
  disabled?: boolean;
  name: string;
}

const toDisplayValue = (value: number | null) =>
  value != null ? (value / 100).toFixed(2) : '';

export function CurrencyInput({
  currency,
  centAmount,
  disabled,
  name,
  onChange,
}: CurrencyInputProps) {
  const [amount, setAmount] = useState<number | string | any>(() =>
    toDisplayValue(centAmount)
  );

  useEffect(() => {
    setAmount(toDisplayValue(centAmount));
  }, [centAmount]);

  const toFloat = (text: string) =>
    text
      .match(/[\d]*[.,]?[\d]{0,2}/)![0]
      .replace(',', '.')
      .replace(/^\./, '');

  return (
    <div>
      <InputGroup inside>
        <Form.Control
          value={amount as string}
          name={name}
          disabled={disabled}
          onChange={(amount: string) => {
            amount = toFloat(amount);
            setAmount(amount);
          }}
          onBlur={() => {
            if (amount) {
              onChange(parseFloat(amount as string) * 100);
            } else {
              onChange(null);
            }
          }}
        />
        <InputGroup.Addon>{currency}</InputGroup.Addon>
      </InputGroup>
    </div>
  );
}
