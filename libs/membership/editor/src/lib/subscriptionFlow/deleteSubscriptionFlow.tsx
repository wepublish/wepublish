import React, {useContext} from 'react'
import {IconButton, Popover, Whisper} from 'rsuite'
import {MdDelete} from 'react-icons/all'
import {SubscriptionFlowFragment} from '@wepublish/editor/api-v2'
import {GraphqlClientContext} from './graphqlClientContext'

interface DeleteSubscriptionFlowProps {
  subscriptionFlow: SubscriptionFlowFragment
  onSubscriptionFlowDeleted?: () => void
}
export default function ({
  subscriptionFlow,
  onSubscriptionFlowDeleted
}: DeleteSubscriptionFlowProps) {
  const client = useContext(GraphqlClientContext)

  return (
    <Whisper
      placement="leftEnd"
      trigger="click"
      speaker={
        <Popover>
          <p>
            Wenn Du diesen Flow löscht, kann dies nicht rückgängig gemacht werden. Willst Du
            trotzdem weiterfahren?
          </p>
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
            Unwiderruflich Löschen
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
