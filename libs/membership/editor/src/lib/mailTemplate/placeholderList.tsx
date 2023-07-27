import React, {useMemo} from 'react'
import {getApiClientV2, ListViewContainer, ListViewHeader} from '@wepublish/ui/editor'
import {useTranslation} from 'react-i18next'
import {NON_USER_ACTION_EVENTS, USER_ACTION_EVENTS} from '../subscriptionFlow/subscriptionFlowList'
import {DEFAULT_QUERY_OPTIONS} from '../common'
import {
  SubscriptionEvent,
  useGetSystemMailsQuery,
  useMailTemplateQuery,
  UserEvent
} from '@wepublish/editor/api-v2'
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import {TypeAttributes} from 'rsuite/esm/@types/common'

interface DecoratedEvent {
  event:
    | SubscriptionEvent.Subscribe
    | SubscriptionEvent.RenewalSuccess
    | SubscriptionEvent.RenewalFailed
    | SubscriptionEvent.DeactivationByUser
    | SubscriptionEvent.InvoiceCreation
    | SubscriptionEvent.DeactivationUnpaid
    | SubscriptionEvent.Custom
    | UserEvent
  title: string
  icon?: JSX.Element
  color?: TypeAttributes.Color
  placeholders: Placeholder[]
}

interface Placeholder {
  key: string
  description: string
  exampleOverride?: string
}

export default function PlaceholderListe() {
  const {t} = useTranslation()

  /**
   * API SERVICES
   */
  const client = useMemo(() => getApiClientV2(), [])
  const {data: systemMails} = useGetSystemMailsQuery(DEFAULT_QUERY_OPTIONS(client, t))
  const {data: mailTemplate} = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS(client, t))

  const placeholderSyntax: {open: string; close: string} | undefined = useMemo(() => {
    const providerName = mailTemplate?.provider.name.toLowerCase()
    switch (providerName) {
      case 'mailchimp':
        return {
          open: '*|',
          close: '|*'
        }
      case 'mailgun':
        return {
          open: '{{',
          close: '}}'
        }
      default:
        return undefined
    }
  }, [mailTemplate])

  function getPlaceholderExample(placeholder: string): string {
    return `${placeholderSyntax?.open || ''}${placeholder}${placeholderSyntax?.close || ''}`
  }

  const defaultPlaceholders: Placeholder[] = [
    {
      key: 'user_id',
      description: t('placeholderList.description.user_id')
    },
    {
      key: 'user_email',
      description: t('placeholderList.description.user_email')
    },
    {
      key: 'user_name',
      description: t('placeholderList.description.user_name')
    },
    {
      key: 'user_firstName',
      description: t('placeholderList.description.user_firstName')
    },
    {
      key: 'jwt',
      description: t('placeholderList.description.jwt'),
      exampleOverride: `Per Klick auf folgenden Link kannst du dich bequem in deinen Account einloggen: <a href="https://www.hauptstadt.be/login?jwt=${getPlaceholderExample(
        'jwt'
      )}">Jetzt einloggen.</a>`
    }
  ]

  const decoratedEvents: DecoratedEvent[] = useMemo(() => {
    let events: DecoratedEvent[] = []

    // (NON) USER ACTION EVENTS
    events = [
      ...events,
      ...[...USER_ACTION_EVENTS, ...NON_USER_ACTION_EVENTS].map(event => {
        let placeholders: Placeholder[] = []
        switch (event) {
          case SubscriptionEvent.RenewalSuccess:
            placeholders = [
              ...placeholders,
              {
                key: 'optional_subscriptionID',
                description: t('placeholderList.description.optional_subscriptionID')
              },
              {
                key: 'optional_subscription_paymentPeriodicity',
                description: t(
                  'placeholderList.description.optional_subscription_paymentPeriodicity'
                )
              },
              {
                key: 'optional_subscription_monthlyAmount',
                description: t('placeholderList.description.optional_subscription_monthlyAmount')
              },
              {
                key: 'optional_subscription_autoRenew',
                description: t('placeholderList.description.optional_subscription_autoRenew')
              },
              {
                key: 'optional_subscription_paymentMethod_name',
                description: t(
                  'placeholderList.description.optional_subscription_paymentMethod_name'
                )
              },
              {
                key: 'optional_subscription_memberPlan_name',
                description: t('placeholderList.description.optional_subscription_memberPlan_name')
              }
            ]
            break
        }

        return {
          event,
          title: t(`subscriptionFlow.${event.toLowerCase()}`),
          placeholders: [...defaultPlaceholders, ...placeholders]
        }
      })
    ]

    // SYSTEM MAILS
    if (systemMails?.getSystemMails) {
      events = [
        ...events,
        ...systemMails.getSystemMails.map(event => {
          const placeholders: Placeholder[] = []

          return {
            event: event.event,
            title: t(`systemMails.events.${event.event.toLowerCase()}`),
            placeholders: [...defaultPlaceholders, ...placeholders]
          }
        })
      ]
    }

    return events
  }, [systemMails, placeholderSyntax])

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('placeholderList.header')}</h2>
          <Typography variant="subtitle1">{t('placeholderList.subtitle')}</Typography>
        </ListViewHeader>
      </ListViewContainer>

      {decoratedEvents &&
        decoratedEvents.map(event => (
          <Grid key={event.event} container spacing={2} sx={{marginTop: 4}}>
            <Grid xs={24}>
              <h2>{event.title}</h2>
            </Grid>

            <Grid xs={24}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <b>{t('placeholderList.placeholder')}</b>
                      </TableCell>
                      <TableCell>
                        <b>{t('placeholderList.descriptionTitle')}</b>
                      </TableCell>
                      <TableCell>
                        <b>{t('placeholderList.example')}</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {event.placeholders.map(placeholder => (
                      <TableRow key={placeholder.key}>
                        <TableCell>{placeholder.key}</TableCell>
                        <TableCell>{placeholder.description}</TableCell>
                        <TableCell>
                          {placeholder.exampleOverride ? (
                            <>{placeholder.exampleOverride}</>
                          ) : (
                            <>
                              Lorem ipsum{' '}
                              <b>
                                <i>{getPlaceholderExample(placeholder.key)}</i>
                              </b>{' '}
                              lorem ipsum lorem ipsum.
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        ))}
    </>
  )
}
