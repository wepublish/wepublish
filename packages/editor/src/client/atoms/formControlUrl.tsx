import React, {useState, useCallback} from 'react'
import {Form, Message} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {validateURL} from '../utility'

interface UrlValidationProps {
  placeholder: string
  name: string
  value?: string
  onChange: (url: string) => void
}

export function FormControlUrl({placeholder, name, value, onChange}: UrlValidationProps) {
  const {t} = useTranslation()
  const [invalidInput, setInvalidInput] = useState(false)

  const handleUrlValidation = useCallback(
    (url: string) => {
      const isValidURL = validateURL(url)
      setInvalidInput(!isValidURL)
    },
    [value]
  )

  return (
    <div>
      <Form.Control
        style={invalidInput ? {border: 'thin solid red'} : {}}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={(url: string) => {
          handleUrlValidation(url)
          onChange(url)
        }}
      />
      {invalidInput && (
        <Message showIcon type="error" style={{marginTop: '5px'}}>
          {t('peerList.overview.invalidURLTooltip')}
        </Message>
      )}
    </div>
  )
}
