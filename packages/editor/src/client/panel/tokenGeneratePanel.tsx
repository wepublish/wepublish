import React, {useState, useEffect} from 'react'

import {Alert, Button, Input, Modal, Panel} from 'rsuite'

import {useCreateTokenMutation, TokenListDocument} from '../api'
import {getOperationNameFromDocument} from '../utility'

import {useTranslation} from 'react-i18next'

export interface TokenGeneratePanelProps {
  onClose?(): void
}

export function TokenGeneratePanel({onClose}: TokenGeneratePanelProps) {
  const [name, setName] = useState('')

  const [createToken, {data, loading: isCreating, error: createError}] = useCreateTokenMutation({
    refetchQueries: [getOperationNameFromDocument(TokenListDocument)]
  })

  const isDisabled = isCreating
  const token = data?.createToken.token
  const hasGeneratedToken = token !== undefined

  const {t} = useTranslation()

  useEffect(() => {
    if (createError?.message) Alert.error(createError.message, 0)
  }, [createError])

  async function handleSave() {
    await createToken({variables: {input: {name}}})
  }

  return (
    <>
      <Modal.Header>
        <Modal.Title>{t('tokenList.panels.generateToken')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {token ? (
          <>
            <p>{t('tokenList.panels.creationSuccess')}</p>
            <Panel bordered>{token}</Panel>
          </>
        ) : (
          <Input
            placeholder={t('tokenList.panels.name')}
            value={name}
            disabled={isDisabled}
            onChange={value => {
              setName(value)
            }}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        {!hasGeneratedToken && (
          <Button disabled={isDisabled} onClick={handleSave} appearance="primary">
            {t('tokenList.panels.generate')}
          </Button>
        )}
        <Button onClick={() => onClose?.()} appearance="subtle">
          {t('tokenList.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
