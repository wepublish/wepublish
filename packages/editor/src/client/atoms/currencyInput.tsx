import React, {useState, useEffect} from 'react'
import {Form, InputGroup} from 'rsuite'

export interface CurrencyInputProps {
  currency: string
  centAmount: number
  onChange(centAmount: number): void
  disabled?: boolean
  name: string
}

export function CurrencyInput({currency, centAmount, disabled, onChange}: CurrencyInputProps) {
  const [amount, setAmount] = useState<number | string | any>(centAmount / 100)

  useEffect(() => {
    setAmount((centAmount / 100).toFixed(2))
  }, [centAmount])

  const toFloat = (text: string) =>
    text
      .match(/[\d]*[.,]?[\d]{0,2}/)![0]
      .replace(',', '.')
      .replace(/^\./, '')

  return (
    <div>
      <Form.Group>
        <InputGroup inside>
          <Form.Control
            value={amount as string}
            name="currency"
            disabled={disabled}
            onChange={(amount: string) => {
              amount = toFloat(amount)
              setAmount(amount)
            }}
            onBlur={() => {
              if (amount) {
                onChange(parseFloat(amount as string) * 100)
              }
            }}
          />
          <InputGroup.Addon>{currency}</InputGroup.Addon>
        </InputGroup>
      </Form.Group>
    </div>
  )
}
