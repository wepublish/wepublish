import React from 'react'
import {Table, TableBody, TableCell, TableHead, TableRow} from '@mui/material'
import {IconButton, SelectPicker} from 'rsuite'
import {MdDelete} from 'react-icons/all'
import SubscriptionFlow from './subscriptionFlow'
import {
  SubscriptionFlowFragment,
  SubscriptionFlowModel,
  SubscriptionIntervalFragment
} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'

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
  subscriptionInterval?: SubscriptionIntervalFragment
}

export interface SubscriptionUserAction extends SubscriptionAction {
  subscriptionEventKey: SubscriptionUserActionKey
}

interface SubscriptionFlowsProps {
  subscriptionFlows?: SubscriptionFlowFragment[]
}

export default function SubscriptionFlows({subscriptionFlows}: SubscriptionFlowsProps) {
  const {t} = useTranslation()

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

  return (
    <>
      <Table>
        <TableHead>
          {!!subscriptionFlows?.length &&
            subscriptionFlows.map(subscriptionFlow => (
              <TableRow>
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
                    <>
                      <TableCell>{subscriptionUserAction.title}</TableCell>
                    </>
                  ))}

                {/* individual flow TODO: extract */}
                <TableCell>Individual flow</TableCell>

                {/* actions */}
                <TableCell>Aktionen</TableCell>
              </TableRow>
            ))}
        </TableHead>
        <TableBody>
          {!!subscriptionFlows?.length &&
            subscriptionFlows.map(subscriptionFlow => (
              <TableRow>
                {/* filter */}
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>

                {/* user actions */}
                {subscriptionUserActions &&
                  subscriptionUserActions.map(subscriptionUserAction => (
                    <>
                      <TableCell>
                        <SelectPicker data={[]} />
                      </TableCell>
                    </>
                  ))}

                {/* individual flow */}
                <TableCell>
                  <SubscriptionFlow subscriptionFlow={subscriptionFlow} />
                </TableCell>
                <TableCell align="center">
                  <IconButton color="red" circle appearance="primary" icon={<MdDelete />} />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </>
  )
}
