import React, { useMemo } from 'react';
import { ListViewContainer, ListViewHeader } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import {
  NON_USER_ACTION_EVENTS,
  USER_ACTION_EVENTS,
} from '../subscription-flow/subscription-flow-list';
import { DEFAULT_QUERY_OPTIONS } from '../common';
import {
  SubscriptionEvent,
  useMailTemplateQuery,
  UserEvent,
  getApiClientV2,
  useSystemMailsQuery,
} from '@wepublish/editor/api-v2';
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { TypeAttributes } from 'rsuite/esm/@types/common';

interface DecoratedEvent {
  event:
    | SubscriptionEvent.Subscribe
    | SubscriptionEvent.ConfirmSubscription
    | SubscriptionEvent.RenewalSuccess
    | SubscriptionEvent.RenewalFailed
    | SubscriptionEvent.DeactivationByUser
    | SubscriptionEvent.InvoiceCreation
    | SubscriptionEvent.DeactivationUnpaid
    | SubscriptionEvent.Custom
    | UserEvent;
  title: string;
  icon?: JSX.Element;
  color?: TypeAttributes.Color;
  placeholders: Placeholder[];
}

interface Placeholder {
  key: string;
  description: string;
  exampleOverride?: string;
}

type PlaceholderSyntax = { open: string; close: string };

const getPlaceHolderSyntax = (
  providerName: string
): PlaceholderSyntax | undefined => {
  switch (providerName) {
    case 'mailchimp':
      return {
        open: '*|',
        close: '|*',
      };
    case 'mailgun':
      return {
        open: '{{',
        close: '}}',
      };
    default:
      return undefined;
  }
};

function getPlaceholderExample(
  providerName: string,
  placeholder: string
): string {
  const syntax = getPlaceHolderSyntax(providerName);

  return `${syntax?.open || ''}${placeholder}${syntax?.close || ''}`;
}

export function PlaceholderList() {
  const { t } = useTranslation();
  const client = useMemo(() => getApiClientV2(), []);
  const { data: systemMails } = useSystemMailsQuery(
    DEFAULT_QUERY_OPTIONS(client)
  );
  const { data: mailTemplate } = useMailTemplateQuery(
    DEFAULT_QUERY_OPTIONS(client)
  );

  const defaultPlaceholders = useMemo(
    () =>
      [
        {
          key: 'user_id',
          description: t('placeholderList.description.user_id'),
        },
        {
          key: 'user_email',
          description: t('placeholderList.description.user_email'),
        },
        {
          key: 'user_name',
          description: t('placeholderList.description.user_name'),
        },
        {
          key: 'user_firstName',
          description: t('placeholderList.description.user_firstName'),
        },
        {
          key: 'jwt',
          description: t('placeholderList.description.jwt'),
          exampleOverride: `Per Klick auf folgenden Link kannst du dich bequem in deinen Account einloggen: <a href="https://www.hauptstadt.be/login?jwt=${getPlaceholderExample(
            mailTemplate?.provider.name.toLowerCase() ?? '',
            'jwt'
          )}">Jetzt einloggen.</a>`,
        },
      ] as Placeholder[],
    [t, mailTemplate?.provider.name]
  );

  const decoratedEvents: DecoratedEvent[] = useMemo(() => {
    let events: DecoratedEvent[] = [];

    // (NON) USER ACTION EVENTS
    events = [
      ...events,
      ...[...USER_ACTION_EVENTS, ...NON_USER_ACTION_EVENTS].map(event => {
        let placeholders: Placeholder[] = [];
        switch (event) {
          case SubscriptionEvent.RenewalSuccess:
            placeholders = [
              ...placeholders,
              {
                key: 'optional_subscriptionID',
                description: t(
                  'placeholderList.description.optional_subscriptionID'
                ),
              },
              {
                key: 'optional_subscription_paymentPeriodicity',
                description: t(
                  'placeholderList.description.optional_subscription_paymentPeriodicity'
                ),
              },
              {
                key: 'optional_subscription_monthlyAmount',
                description: t(
                  'placeholderList.description.optional_subscription_monthlyAmount'
                ),
              },
              {
                key: 'optional_subscription_autoRenew',
                description: t(
                  'placeholderList.description.optional_subscription_autoRenew'
                ),
              },
              {
                key: 'optional_subscription_paymentMethod_name',
                description: t(
                  'placeholderList.description.optional_subscription_paymentMethod_name'
                ),
              },
              {
                key: 'optional_subscription_memberPlan_name',
                description: t(
                  'placeholderList.description.optional_subscription_memberPlan_name'
                ),
              },
            ];
            break;
        }

        return {
          event,
          title: t(`subscriptionFlow.${event.toLowerCase()}`),
          placeholders: [...defaultPlaceholders, ...placeholders],
        };
      }),
    ];

    // SYSTEM MAILS
    if (systemMails?.systemMails) {
      events = [
        ...events,
        ...systemMails.systemMails.map(event => {
          const placeholders: Placeholder[] = [];

          return {
            event: event.event,
            title: t(`systemMails.events.${event.event.toLowerCase()}`),
            placeholders: [...defaultPlaceholders, ...placeholders],
          };
        }),
      ];
    }

    return events;
  }, [defaultPlaceholders, systemMails?.systemMails, t]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('placeholderList.header')}</h2>
          <Typography variant="subtitle1">
            {t('placeholderList.subtitle')}
          </Typography>
        </ListViewHeader>
      </ListViewContainer>

      {decoratedEvents &&
        decoratedEvents.map(event => (
          <Grid
            key={event.event}
            container
            spacing={2}
            sx={{ marginTop: 4 }}
          >
            <Grid xs={24}>
              <h2>{event.title}</h2>
            </Grid>

            <Grid xs={24}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>{t('placeholderList.placeholder')}</strong>
                      </TableCell>

                      <TableCell>
                        <strong>{t('placeholderList.descriptionTitle')}</strong>
                      </TableCell>

                      <TableCell>
                        <strong>{t('placeholderList.example')}</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {event.placeholders.map(placeholder => (
                      <TableRow key={placeholder.key}>
                        <TableCell>{placeholder.key}</TableCell>
                        <TableCell>{placeholder.description}</TableCell>

                        <TableCell>
                          {placeholder.exampleOverride ?? (
                            <>
                              Lorem ipsum{' '}
                              <strong>
                                <i>
                                  {getPlaceholderExample(
                                    mailTemplate?.provider.name.toLowerCase() ??
                                      '',
                                    placeholder.key
                                  )}
                                </i>
                              </strong>{' '}
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
  );
}
