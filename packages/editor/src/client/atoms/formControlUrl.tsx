import React, {useState, useCallback} from 'react'
import {FormControl, Whisper, Tooltip} from 'rsuite'
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
  const [urlTooltip, setUrlTooltip] = useState(<div></div>)
  const [invalidInput, setInvalidInput] = useState(false)

  const handleUrlValidation = useCallback(
    (url: string) => {
      const isValidURL = validateURL(url)
      if (isValidURL) {
        setInvalidInput(false)
        setUrlTooltip(<Tooltip>{t('peerList.overview.validURLTooltip')}</Tooltip>)
      } else {
        setInvalidInput(true)
        setUrlTooltip(<Tooltip>{t('peerList.overview.invalidURLTooltip')}</Tooltip>)
      }
    },
    [value]
  )

  return (
    <div>
      <Whisper placement="topStart" trigger="focus" speaker={urlTooltip}>
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
      </Whisper>
    </div>
  )
}
