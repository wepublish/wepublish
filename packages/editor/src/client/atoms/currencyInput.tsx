import React, {useState, useEffect} from 'react'
import {InputNumber} from 'rsuite'

export interface CurrencyInputProps {
  currency?: string
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
  const [amount, setAmount] = useState<number>((centAmount as number) / 100)

  useEffect(() => {
    setAmount(centAmount / 100)
  }, [centAmount])

  return (
    <div>
      <InputNumber
        prefix={currency}
        step={step}
        value={Number(amount).toFixed(2)}
        onChange={amount => {
          setAmount(amount as number)
          onChange((amount as number) * 100)
        }}
        disabled={disabled}></InputNumber>
    </div>
  )
}
