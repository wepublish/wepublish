import React, {useState, useEffect} from 'react'
import {InputNumber} from 'rsuite'

export interface CurrencyInputProps {
  currency?: string
  centAmount: number
  step?: number
  onChange(value: number): void
  disabled?: boolean
}

export function CurrencyInput({
  currency,
  centAmount,
  step,
  disabled,
  onChange
}: CurrencyInputProps) {
  const [displayedCurrency, setDisplayedCurrency] = useState<number>((centAmount as number) / 100)

  useEffect(() => {
    setDisplayedCurrency(centAmount / 100)
  }, [centAmount])

  return (
    <div>
      <InputNumber
        prefix={currency}
        step={step}
        value={Number(displayedCurrency).toFixed(2)}
        onChange={value => {
          setDisplayedCurrency(value as number)
          onChange((value as number) * 100)
        }}
        disabled={disabled}></InputNumber>
    </div>
  )
}
