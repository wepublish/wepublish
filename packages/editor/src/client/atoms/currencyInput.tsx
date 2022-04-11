import React, {useState, useEffect} from 'react'
import {Input, InputGroup, Message} from 'rsuite'
import {useTranslation} from 'react-i18next'

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

  const toFloat = (text: string) =>
    text
      .match(/[\d]*[.,]?[0-9]{0,2}/)![0]
      .replace(',', '.')
      .replace(/^\./, '')

  const {t} = useTranslation()

  return (
    <div>
      <InputGroup>
        <InputGroup.Addon>{currency}</InputGroup.Addon>
        <Input
          value={amount as string}
          step={step}
          disabled={disabled}
          onChange={amount => {
            amount = toFloat(amount)
            if (!amount) {
              setMessage(true)
            } else {
              setMessage(false)
            }
            setAmount(amount)
          }}
          onBlur={() => {
            if (amount) {
              onChange(parseFloat(amount as string) * 100)
            }
          }}
        />
      </InputGroup>
      {message ? <Message type="error" description={t('memberPlanList.errorMessage')} /> : ''}
    </div>
  )
}
