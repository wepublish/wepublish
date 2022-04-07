import React, {useState, useEffect} from 'react'
import {Input, InputGroup} from 'rsuite'

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

  useEffect(() => {
    setAmount((centAmount / 100).toFixed(2))
  }, [centAmount])

  return (
    <div>
      <InputGroup>
        <InputGroup.Addon>{currency}</InputGroup.Addon>
        <Input
          value={amount as string}
          step={step}
          type="number"
          disabled={disabled}
          lang="en"
          onChange={amount => {
            setAmount(parseFloat(amount))
            console.log(amount.replace(',', '.'))
          }}
          onBlur={() => {
            onChange(Math.round(parseFloat(amount as string) * 100))
          }}
        />

        {/* <input
          value={amount}
          step={step}
          type="number"
          disabled={disabled}
          lang='en'
          onChange={amount => {
            setAmount(parseFloat(amount))
            console.log(amount)
          }}
          onBlur={() => {
            onChange(Math.round(parseFloat(amount) * 100))
          }}> */}
        {/* </input> */}
      </InputGroup>
    </div>
  )
}
