import {ApolloError} from '@apollo/client'
import {stripTypename} from '@wepublish/editor/api'
import {
  MutationUpdateConsentArgs,
  useConsentQuery,
  useUpdateConsentMutation
} from '@wepublish/editor/api-v2'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {Form, Message, Schema, toaster} from 'rsuite'

import {ModelTitle} from '@wepublish/ui/editor'
import {ConsentForm} from './consent-form'
import {getApiClientV2} from '../apiClientv2'

const mapApiDataToInput = (consent: any): MutationUpdateConsentArgs['consent'] => ({
  ...stripTypename(consent),
  name: consent.name,
  slug: consent.slug,
  defaultValue: consent.defaultValue
})

export const ConsentEditView = () => {
  const {id} = useParams()
  const consentId = id!

  const client = useMemo(() => getApiClientV2(), [])
  const navigate = useNavigate()
  const {t} = useTranslation()

  const onErrorToast = (error: ApolloError, slug?: string) => {
    if (error.message.includes('Unique constraint')) {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {t('consents.uniqueConstraint', {slug})}
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

  const closePath = '/consents'
  const [consent, setConsent] = useState({
    defaultValue: true,
    name: '',
    slug: ''
  })

  const [shouldClose, setShouldClose] = useState<boolean>(false)

  const {loading: dataLoading} = useConsentQuery({
    client,
    variables: {
      id: consentId
    },
    onError: onErrorToast,
    onCompleted: data => {
      if (data.consent) {
        setConsent(mapApiDataToInput(data.consent))
      }
    }
  })

  const [updateConsent, {loading: updateLoading}] = useUpdateConsentMutation({
    client,
    onError: error => onErrorToast(error, consent.slug),
    onCompleted: data => {
      if (shouldClose) {
        navigate(closePath)
      }
      if (data.updateConsent) {
        setConsent(mapApiDataToInput(data.updateConsent))
      }
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('toast.updatedSuccess')}
        </Message>
      )
    }
  })

  const onSubmit = () => {
    updateConsent({
      variables: {
        id: consentId,
        consent: {
          name: consent.name,
          slug: consent.slug,
          defaultValue: consent.defaultValue
        }
      }
    })
  }

  const loading = dataLoading || updateLoading

  const {StringType, BooleanType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(),
    slug: StringType().isRequired(),
    defaultValue: BooleanType().isRequired()
  })

  return (
    <Form
      fluid
      formValue={consent}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}>
      <ModelTitle
        loading={loading}
        title={t('consents.titleEdit')}
        loadingTitle={t('consents.titleEdit')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <ConsentForm
        consent={consent}
        create
        onChange={changes => setConsent(oldConsent => ({...oldConsent, ...(changes as any)}))}
      />
    </Form>
  )
}
