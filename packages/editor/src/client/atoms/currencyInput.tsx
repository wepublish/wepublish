import React from 'react'
import {InputNumber} from 'rsuite'

export interface CurrencyInputProps {
  prefix?: string
  value?: string | number
  step?: number
  changeCurrencyAmount(amount: number | string): void
  disabled?: boolean
}

export function CurrencyInput({
  prefix,
  value,
  step,
  changeCurrencyAmount,
  disabled
}: CurrencyInputProps) {
  return (
    <div>
      <InputNumber
        prefix={prefix}
        step={step}
        value={parseFloat(value as string).toFixed(2)}
        onChange={changeCurrencyAmount}
        disabled={disabled}></InputNumber>
    </div>
  )
}
