import React, {useState, useCallback} from 'react'
import {Form, Message} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {validateURL} from '../utility'
import styled from '@emotion/styled'

interface UrlValidationProps {
  placeholder: string
  name: string
  value?: string
  onChange: (url: string) => void
}

const StyledMessage = styled(Message)`
  margin-top: 5px;
`

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
        <StyledMessage showIcon type="error">
          {t('peerList.overview.invalidURLTooltip')}
        </StyledMessage>
      )}
    </div>
  )
}
