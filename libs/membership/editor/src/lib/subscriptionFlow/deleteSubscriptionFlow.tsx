import React, {useContext} from 'react'
import {IconButton, Popover, Whisper} from 'rsuite'
import {MdDelete} from 'react-icons/md'
import {SubscriptionFlowFragment} from '@wepublish/editor/api-v2'
import {GraphqlClientContext} from './graphqlClientContext'
import {useTranslation} from 'react-i18next'
import {PermissionControl} from '@wepublish/ui/editor'

interface DeleteSubscriptionFlowProps {
  subscriptionFlow: SubscriptionFlowFragment
}
export default function ({subscriptionFlow}: DeleteSubscriptionFlowProps) {
  const {t} = useTranslation()
  const client = useContext(GraphqlClientContext)

  if (subscriptionFlow.default) {
    return <></>
  }

  return (
    <PermissionControl qualifyingPermissions={['CAN_DELETE_SUBSCRIPTION_FLOW']}>
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
    </PermissionControl>
  )
}
