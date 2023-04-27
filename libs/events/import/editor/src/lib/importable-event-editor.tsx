import {ApolloError} from '@apollo/client'
import {
  EventRefFragment,
  ImageRefFragment,
  MutationCreateEventArgs,
  stripTypename,
  useCreateEventMutation,
  useEventQuery,
  useUpdateEventMutation
} from '@wepublish/editor/api'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {Form, Message, Schema, toaster} from 'rsuite'
import {Providers, useImportedEventQuery, ImportabeEventRefFragment} from '@wepublish/editor/api-v2'
import {getApiClientV2} from '../apiClientv2'

import {ModelTitle} from '@wepublish/ui/editor'
import {ImportableEventForm} from './importable-event-form'

const onErrorToast = (error: ApolloError) => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

// const mapApiDataToInput = (event: ImportabeEventRefFragment) => ({
//   ...stripTypename(event)
//   // description: event.description as
//   // imageId: event.image?.id,
//   // tagIds: event.tags?.map(tag => tag.id)
//   // ...event
// })

const mapApiDataToInput = (
  event: EventRefFragment
): MutationCreateEventArgs & {image?: ImageRefFragment | null} => ({
  ...stripTypename(event),
  imageId: event.image?.id,
  tagIds: event.tags?.map(tag => tag.id)
})

export const ImportableEventEditor = () => {
  const client = useMemo(() => getApiClientV2(), [])
  const {id} = useParams()
  const eventId = id!
  const navigate = useNavigate()
  const {t} = useTranslation()

  const closePath = '/events/import'

  // todo use MutationCreateEventArgs?
  const [event, setEvent] = useState({
    name: '',
    id: eventId,
    externalSourceId: eventId,
    externalSourceName: 'AgendaBasel', // todo
    startsAt: ''
  } as MutationCreateEventArgs & {image?: ImageRefFragment | null})

  const [shouldClose, setShouldClose] = useState(false)

  const {loading: dataLoading} = useImportedEventQuery({
    client,
    fetchPolicy: 'no-cache',
    variables: {
      filter: {
        id: eventId,
        source: Providers.AgendaBasel
      }
    },
    onError: onErrorToast,
    onCompleted: data => {
      if (data.importedEvent) {
        setEvent(mapApiDataToInput(data.importedEvent))
      }
    }
  })

  console.log('event.description', event.description)

  // const prepareDescription = {...event.description, }
  // event?.description[0] && event.description[0].type: 'paragraph'

  const [createEvent, {loading: createLoading}] = useCreateEventMutation({
    onError: onErrorToast,
    onCompleted: event => {
      if (shouldClose) {
        navigate(closePath)
      } else {
        navigate(`/events/edit/${event.createEvent?.id}`)
      }
    }
  })
  console.log('createLoading', createLoading)
  // const {loading: dataLoading} = useEventQuery({
  //   variables: {
  //     id: eventId
  //   },
  //   onError: onErrorToast,
  // onCompleted: data => {
  //   if (data.event) {
  //     setEvent(mapApiDataToInput(data.event))
  //   }
  // }
  // })

  // const [updateEvent, {loading: updateLoading}] = useUpdateEventMutation({
  //   onError: onErrorToast,
  //   onCompleted: data => {
  //     if (shouldClose) {
  //       navigate(closePath)
  //     }

  //     if (data.updateEvent) {
  //       setEvent(mapApiDataToInput(data.updateEvent))
  //     }
  //   }
  // })

  // const loading = dataLoading || updateLoading

  const onSubmit = () => {
    const {image, ...eventWithoutImage} = event!
    createEvent({variables: eventWithoutImage})
  }

  const {StringType, DateType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(),
    status: StringType().isRequired(),
    startsAt: DateType().isRequired(),
    endsAt: DateType().min(new Date(event.startsAt ?? new Date()))
  })

  // console.log('data', data)
  console.log('event dupa', event)

  return (
    <Form
      fluid
      formValue={event || {}}
      model={validationModel}
      disabled={dataLoading}
      onSubmit={validationPassed => validationPassed && onSubmit()}>
      <ModelTitle
        loading={dataLoading}
        title={t('importableEvent.editTitle')}
        loadingTitle={t('importableEvent.editTitle')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <div>event id: {id}</div>
      <ImportableEventForm
        event={event}
        onChange={changes => setEvent(oldEvent => ({...oldEvent, ...(changes as any)}))}
      />
    </Form>
  )
}
