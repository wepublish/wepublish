import React, {useState, useEffect} from 'react'
import {InputNumber} from 'rsuite'

export interface CurrencyInputProps {
  prefix?: string
  centAmount: number
  step?: number
  onChange(value: number): void
  disabled?: boolean
}

export function CurrencyInput({prefix, centAmount, step, disabled, onChange}: CurrencyInputProps) {
  const [amount, setAmount] = useState<number>((centAmount as number) / 100)

  useEffect(() => {
    setAmount(centAmount / 100)
  }, [centAmount])

  return (
    <div>
      <InputNumber
        prefix={prefix}
        step={step}
        value={Number(amount).toFixed(2)}
        onChange={value => {
          setAmount(value as number)
          onChange((value as number) * 100)
        }}
        disabled={disabled}></InputNumber>
    </div>
  )
}
