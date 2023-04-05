import {ApolloError} from '@apollo/client'
import {stripTypename} from '@wepublish/editor/api'
import {
  MutationUpdateUserConsentArgs,
  useUpdateUserConsentMutation,
  useUserConsentQuery
} from '@wepublish/editor/api-v2'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {Form, Message, Schema, toaster} from 'rsuite'

import {ModelTitle} from '@wepublish/ui/editor'
import {UserConsentForm} from './user-consent-form'
import {getApiClientV2} from '../apiClientv2'

const mapApiDataToInput = (userConsent: any): MutationUpdateUserConsentArgs['userConsent'] => ({
  ...stripTypename(userConsent),
  value: userConsent.value
})

const onErrorToast = (error: ApolloError, slug?: string) => {
  if (error.message.includes('Unique constraint')) {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {`A user consent with slug '${slug}' already exists. Please choose a different slug.`}
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

export const UserConsentEditView = () => {
  const {id} = useParams()
  const userConsentId = id!

  const client = useMemo(() => getApiClientV2(), [])
  const navigate = useNavigate()
  const {t} = useTranslation()

  const closePath = '/userConsents'
  const [userConsent, setUserConsent] = useState({
    value: false
  } as MutationUpdateUserConsentArgs['userConsent'])

  const [shouldClose, setShouldClose] = useState<boolean>(false)

  const {loading: dataLoading} = useUserConsentQuery({
    client,
    variables: {
      id: userConsentId
    },
    onError: onErrorToast,
    onCompleted: data => {
      if (data.userConsent) {
        setUserConsent(mapApiDataToInput(data.userConsent))
      }
    }
  })

  const [updateUserConsent, {loading: updateLoading}] = useUpdateUserConsentMutation({
    client,
    onError: error => onErrorToast(error, 'userConsent.consent.slug'),
    onCompleted: data => {
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('toast.updatedSuccess')}
        </Message>
      )
      if (shouldClose) {
        navigate(closePath)
      }
      if (data.updateUserConsent) {
        setUserConsent(mapApiDataToInput(data.updateUserConsent))
      }
    }
  })

  const onSubmit = () => {
    updateUserConsent({
      variables: {
        id: userConsentId,
        userConsent: {
          value: userConsent.value
        }
      }
    })
  }

  const loading = dataLoading || updateLoading

  const {BooleanType} = Schema.Types
  const validationModel = Schema.Model({
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
        title={t('userConsents.titleEdit')}
        loadingTitle={t('userConsents.titleEdit')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <UserConsentForm
        userConsent={userConsent}
        isEdit
        onChange={changes => setUserConsent(oldConsent => ({...oldConsent, ...(changes as any)}))}
      />
    </Form>
  )
}
