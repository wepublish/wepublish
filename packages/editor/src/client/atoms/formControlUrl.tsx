import React, {useState, useCallback} from 'react'
import {FormControl, Whisper, Tooltip} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {validateURL} from '../utility'

async function useUrlValidation(url: string) {
  const checkUrl = await validateURL(url)
  if (checkUrl) {
    return {isValidURL: true}
  } else {
    return {isValidURL: false}
  }
}

interface UrlValidationProps {
  placeholder: string
  name: string
  value: string
  urlInput: (url: string) => void
}

export function FormControlUrl({placeholder, name, value, urlInput}: UrlValidationProps) {
  const {t} = useTranslation()
  const [urlTooltip, setUrlTooltip] = useState(<div></div>)

  const handleUrlValidation = useCallback(
    async (url: string) => {
      const {isValidURL} = await useUrlValidation(url)
      if (isValidURL) {
        setUrlTooltip(<div></div>)
      } else {
        setUrlTooltip(<Tooltip>{t('peerList.overview.invalidURLTooltip')}</Tooltip>)
      }
    },
    [value]
  )

  return (
    <div>
      <Whisper placement="topStart" trigger="focus" speaker={urlTooltip}>
        <FormControl
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={url => {
            handleUrlValidation(url)
            urlInput(url)
          }}
        />
      </Whisper>
    </div>
  )
}
