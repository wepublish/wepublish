import React, {useState, useCallback} from 'react'
import {FormControl, Message} from 'rsuite'
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
      <FormControl
        style={invalidInput ? {border: 'thin solid red'} : {}}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={url => {
          handleUrlValidation(url)
          onChange(url)
        }}
      />
      {invalidInput && (
        <Message
          showIcon
          type="error"
          description={t('peerList.overview.invalidURLTooltip')}
          style={{marginTop: '5px'}}
        />
      )}
    </div>
  )
}
