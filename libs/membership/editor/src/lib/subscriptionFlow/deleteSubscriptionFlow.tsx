import React, {useContext} from 'react'
import {IconButton, Popover, Whisper} from 'rsuite'
import {MdDelete} from 'react-icons/all'
import {SubscriptionFlowFragment} from '@wepublish/editor/api-v2'
import {GraphqlClientContext} from './graphqlClientContext'
import {useTranslation} from 'react-i18next'

interface DeleteSubscriptionFlowProps {
  subscriptionFlow: SubscriptionFlowFragment
  onSubscriptionFlowDeleted?: () => void
}
export default function ({
  subscriptionFlow,
  onSubscriptionFlowDeleted
}: DeleteSubscriptionFlowProps) {
  const {t} = useTranslation()
  const client = useContext(GraphqlClientContext)

  return (
    <Whisper
      placement="leftEnd"
      trigger="click"
      speaker={
        <Popover>
          <p>{t('subscriptionFlow.deleteFlowQuestion')}</p>
          <IconButton
            style={{marginTop: '5px'}}
            color="red"
            size="sm"
            appearance="primary"
            icon={<MdDelete />}
            onClick={async () => {
              await client.deleteSubscriptionFlow({
                variables: {subscriptionFlowId: subscriptionFlow.id}
              })
              if (onSubscriptionFlowDeleted) {
                onSubscriptionFlowDeleted()
              }
            }}>
            {t('subscriptionFlow.deletePermanently')}
          </IconButton>
        </Popover>
      }>
      <IconButton
        size="sm"
        color="red"
        circle
        appearance="primary"
        icon={<MdDelete />}
        disabled={subscriptionFlow.default}
      />
    </Whisper>
  )
}
