import React, {useState} from 'react'
import {useEffect} from 'react'
import {InputNumber} from 'rsuite'

export interface CurrencyInputProps {
  prefix?: string
  value: number
  step?: number
  onChange(value: number): void
  disabled?: boolean
}

export function CurrencyInput({prefix, value, step, disabled, onChange}: CurrencyInputProps) {
  const [displayedCurrency, setDisplayedCurrency] = useState<number>((value as number) / 100)

  useEffect(() => {
    setDisplayedCurrency(value / 100)
  }, [value])

  return (
    <div>
      <InputNumber
        prefix={prefix}
        step={step}
        value={displayedCurrency}
        onChange={value => {
          setDisplayedCurrency(value as number)
          onChange((value as number) * 100)
        }}
        disabled={disabled}></InputNumber>
    </div>
  )
}
