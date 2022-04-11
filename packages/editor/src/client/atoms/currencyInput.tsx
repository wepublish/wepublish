import {text} from 'express'
import React, {useState, useEffect} from 'react'
import {Input, InputGroup, Message} from 'rsuite'

export interface CurrencyInputProps {
  currency: string
  centAmount: number
  step?: number
  onChange(centAmount: number): void
  disabled?: boolean
}

export function CurrencyInput({
  currency,
  centAmount,
  step,
  disabled,
  onChange
}: CurrencyInputProps) {
  const [amount, setAmount] = useState<number | string | any>(centAmount / 100)
  const [message, setMessage] = useState(false)

  useEffect(() => {
    setAmount((centAmount / 100).toFixed(2))
  }, [centAmount])

  const toFloat = (text: String) => text.replace(/[^0-9,\.?]/gm, '').replace(',', '.')

  return (
    <div>
      <InputGroup>
        <InputGroup.Addon>{currency}</InputGroup.Addon>
        <Input
          value={amount as string}
          step={step}
          pattern={/[+-]?([0-9]*[.]{0,1})?[0-9]+/}
          disabled={disabled}
          lang="en"
          onChange={amount => {
            if (!amount || !toFloat(amount).match(/[+-]?([0-9]*[.]{0,1})?[0-9]+/)) {
              setMessage(true)
              setAmount('')
            } else {
              setMessage(false)
              setAmount(toFloat(amount))
            }
          }}
          onBlur={() => {
            if (amount) {
              onChange(Math.round(parseFloat(amount as string) * 100))
            }
          }}
        />
      </InputGroup>
      {message ? <Message type="error" description=" Please enter a number" /> : ''}
    </div>
  )
}
