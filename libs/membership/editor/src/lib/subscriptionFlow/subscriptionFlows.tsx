import React, {createContext, useMemo, useState} from 'react'
import {Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material'
import {IconButton, Message, SelectPicker, toaster} from 'rsuite'
import {MdDelete} from 'react-icons/all'
import SubscriptionFlow from './subscriptionFlow'
import {
  FullMailTemplateFragment,
  SubscriptionFlowFragment,
  SubscriptionFlowModel,
  SubscriptionIntervalFragment,
  useDeleteSubscriptionFlowMutation,
  useMailTemplateQuery,
  useSubscriptionFlowsQuery,
} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import {getApiClientV2} from '../../../../../../apps/editor/src/app/utility'
import {ApolloError} from '@apollo/client'

/**
 * CONTEXT
 */
export const MailTemplatesContext = createContext<FullMailTemplateFragment[]>([])

/**
 * TYPES
 */
export type SubscriptionUserActionKey = keyof Pick<
  SubscriptionFlowModel,
  | 'subscribeMailTemplate'
  | 'renewalSuccessMailTemplate'
  | 'renewalFailedMailTemplate'
  | 'deactivationByUserMailTemplate'
  | 'reactivationMailTemplate'
>

export type SubscriptionNonUserActionKey = keyof Pick<
  SubscriptionFlowModel,
  'invoiceCreationMailTemplate' | 'deactivationUnpaidMailTemplate'
>

export interface SubscriptionAction {
  title: string
  description: string
}

export interface SubscriptionNonUserAction extends SubscriptionAction {
  subscriptionEventKey?: SubscriptionNonUserActionKey
  subscriptionInterval: SubscriptionIntervalFragment
}

export interface SubscriptionUserAction extends SubscriptionAction {
  subscriptionEventKey: SubscriptionUserActionKey
}

export const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

interface SubscriptionFlowsProps {
  defaultSubscriptionMode: boolean
}

export default function SubscriptionFlows({defaultSubscriptionMode}: SubscriptionFlowsProps) {
  const {t} = useTranslation()
  const [subscriptionFlows, setSubscriptionFlows] = useState<SubscriptionFlowFragment[]>([])
  const subscriptionUserActions: SubscriptionUserAction[] = [
    {
      subscriptionEventKey: 'subscribeMailTemplate',
      title: t('subscriptionFlow.subscribe'),
      description: t('subscriptionFlow.subscribeDescription')
    },
    {
      subscriptionEventKey: 'renewalSuccessMailTemplate',
      title: t('subscriptionFlow.renewalSuccess'),
      description: t('subscriptionFlow.renewalSuccessDescription')
    },
    {
      subscriptionEventKey: 'renewalFailedMailTemplate',
      title: t('subscriptionFlow.renewalFailed'),
      description: t('subscriptionFlow.renewalFailedDescription')
    },
    {
      subscriptionEventKey: 'deactivationByUserMailTemplate',
      title: t('subscriptionFlow.deactivationByUser'),
      description: t('subscriptionFlow.deactivationByUserDescription')
    },
    {
      subscriptionEventKey: 'reactivationMailTemplate',
      title: t('subscriptionFlow.reactivation'),
      description: t('subscriptionFlow.reactivationDescription')
    }
  ]

  /**
   * API SERVICES
   */
  // get correct v2 client
  const client = useMemo(() => getApiClientV2(), [])
  // get subscriptions flows
  const {loading: loadingSubscriptionFlow, refetch} = useSubscriptionFlowsQuery({
    variables: {
      defaultFlowOnly: defaultSubscriptionMode
    },
    client,
    onError: showErrors,
    onCompleted: data => setSubscriptionFlows(data.SubscriptionFlows)
  })

  const [deleteSubscriptionFlow, {loading: deletionLoading}] = useDeleteSubscriptionFlowMutation({
    client,
    onError: showErrors
  })

  // get mail templates
  const {data: mailTemplates, loading: loadingMailTemplates} = useMailTemplateQuery({
    client,
    onError: showErrors
  })

  /**
   * loading
   * TODO: implement load indication
   */
  const loading = useMemo(
    () => loadingSubscriptionFlow || loadingMailTemplates,
    [loadingSubscriptionFlow]
  )

  return (
    <MailTemplatesContext.Provider value={mailTemplates?.mailTemplates || []}>
        <Table>
          <TableHead>
            {subscriptionFlows.map(subscriptionFlow => (
              <TableRow key={subscriptionFlow.id}>
                {/* filter TODO: extract */}
                <TableCell>
                  <b>Memberplan</b>
                </TableCell>
                <TableCell>
                  <b>Payment Provider</b>
                </TableCell>
                <TableCell>
                  <b>Periodicity</b>
                </TableCell>
                <TableCell>
                  <b>Auto Renewal?</b>
                </TableCell>

                {/* mail templates only TODO: extract */}
                {subscriptionUserActions &&
                  subscriptionUserActions.map(subscriptionUserAction => (
                    <TableCell key={subscriptionUserAction.subscriptionEventKey}>{subscriptionUserAction.title}</TableCell>
                  ))}

                {/* individual flow TODO: extract */}
                <TableCell>Individual flow</TableCell>

                {/* actions */}
                <TableCell>Aktionen</TableCell>
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {subscriptionFlows.map(subscriptionFlow => (
              <TableRow key={subscriptionFlow.id}>
                {/* filter */}
                <TableCell>{subscriptionFlow.memberPlan.name}</TableCell>
                <TableCell>{subscriptionFlow.paymentMethods.map(m => m.name).join(', ')}</TableCell>
                <TableCell>{subscriptionFlow.periodicities.join(', ')}</TableCell>
                <TableCell>{subscriptionFlow.autoRenewal.join(', ')}</TableCell>

                {/* user actions */}
                {subscriptionUserActions &&
                  subscriptionUserActions.map(subscriptionUserAction => (
                    <TableCell>
                          <SelectPicker data={[]} />
                      </TableCell>
                  ))}

                {/* individual flow */}
                <TableCell>
                  <SubscriptionFlow subscriptionFlow={subscriptionFlow} client={client} />
                </TableCell>
                <TableCell align="center">
                  <IconButton color="red" circle appearance="primary" icon={<MdDelete />}
                    onClick={() => deleteSubscriptionFlow({ variables: { subscriptionFlowId: subscriptionFlow.id } })} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </MailTemplatesContext.Provider>
  )
}
