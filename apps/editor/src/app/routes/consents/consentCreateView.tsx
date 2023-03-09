import {ApolloClient, ApolloError, HttpLink, InMemoryCache} from '@apollo/client'
// import {
//   ImageRefFragment,
//   MutationCreateEventArgs,
//   useCreateEventMutation
// } from '@wepublish/editor/api'
import {
  ConsentValue,
  useConsentsQuery,
  useCreateConsentMutation,
  useDeleteConsentMutation,
  MutationCreateConsentArgs
} from '@wepublish/editor/api-v2'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate} from 'react-router-dom'
import {Form, Message, Schema, toaster} from 'rsuite'

import {ModelTitle} from '../../atoms/modelTitle'
import {ConsentForm} from './consentForm'
import {EventForm} from './eventForm'

export function getApiClientV2() {
  const apiURL = 'http://localhost:4000'
  const link = new HttpLink({uri: `${apiURL}/v2`})
  return new ApolloClient({
    link,
    cache: new InMemoryCache()
  })
}

const onErrorToast = (error: ApolloError) => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

export const ConsentCreateView = () => {
  const client = useMemo(() => getApiClientV2(), [])
  const navigate = useNavigate()
  const {t} = useTranslation()

  const closePath = '/consents'
  const [consent, setConsent] = useState({
    name: '',
    slug: '',
    defaultValue: ConsentValue.Accepted
  } as MutationCreateConsentArgs['consent'])

  const [shouldClose, setShouldClose] = useState(false)

  const [createConsent, {loading}] = useCreateConsentMutation({
    client,
    onError: onErrorToast,
    onCompleted: consent => {
      if (shouldClose) {
        navigate(closePath)
      } else {
        navigate(`/consents/edit/${consent.createConsent?.id}`)
      }
    }
  })

  // const onSubmit = () => {
  //   const {image, ...eventWithoutImage} = event
  //   createEvent({variables: eventWithoutImage})
  // }

  const onSubmit = async () => {
    const {data: newConsentData, errors} = await createConsent({
      variables: {
        consent
      }
    })
    console.log('errors', errors)
    console.log('newConsentData', newConsentData)
    // refetch()
  }

  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(),
    slug: StringType().isRequired(),
    defaultValue: StringType().isRequired()
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
        title={t('event.create.title')}
        loadingTitle={t('event.create.title')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      {/* <EventForm
        event={event}
        create
        onChange={changes => setEvent(oldEvent => ({...oldEvent, ...(changes as any)}))}
      /> */}

      <ConsentForm
        consent={consent}
        create
        onChange={changes => setConsent(oldConsent => ({...oldConsent, ...(changes as any)}))}
      />
    </Form>
  )
}
