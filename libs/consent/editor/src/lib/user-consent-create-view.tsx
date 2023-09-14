import {ApolloError} from '@apollo/client'
import {MutationCreateUserConsentArgs, useCreateUserConsentMutation} from '@wepublish/editor/api-v2'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate} from 'react-router-dom'
import {Form, Message, Schema, toaster} from 'rsuite'

import {ModelTitle} from '@wepublish/ui/editor'
import {UserConsentForm} from './user-consent-form'
import {getApiClientV2} from '../apiClientv2'

const onErrorToast = (error: ApolloError, slug?: string) => {
  if (error.message.includes('Unique constraint')) {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {`A consent with slug '${slug}' already exists. Please choose a different slug.`}
      </Message>
    )
    return
  }
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

export const UserConsentCreateView = () => {
  const client = useMemo(() => getApiClientV2(), [])
  const navigate = useNavigate()
  const {t} = useTranslation()

  const closePath = '/userConsents'
  const [userConsent, setUserConsent] = useState({
    consentId: '',
    userId: '',
    value: true
  } as MutationCreateUserConsentArgs['userConsent'])

  const [shouldClose, setShouldClose] = useState(false)

  const [createUserConsent, {loading}] = useCreateUserConsentMutation({
    client,
    onError: error => onErrorToast(error, userConsent.userId),
    onCompleted: consent => {
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('toast.createdSuccess')}
        </Message>
      )
      if (shouldClose) {
        navigate(closePath)
      } else {
        navigate(`/userConsents/edit/${consent.createUserConsent?.id}`)
      }
    }
  })

  const onSubmit = () => {
    createUserConsent({
      variables: {
        userConsent
      }
    })
  }

  const {StringType, BooleanType} = Schema.Types
  const validationModel = Schema.Model({
    userId: StringType().isRequired(),
    consentId: StringType().isRequired(),
    value: BooleanType().isRequired()
  })

  return (
    <Form
      fluid
      formValue={userConsent}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}>
      <ModelTitle
        loading={loading}
        title={t('userConsents.titleCreate')}
        loadingTitle={t('userConsents.titleCreate')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <UserConsentForm
        userConsent={userConsent}
        onChange={changes => setUserConsent(oldConsent => ({...oldConsent, ...(changes as any)}))}
      />
    </Form>
  )
}
