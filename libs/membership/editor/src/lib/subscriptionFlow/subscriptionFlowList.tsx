import React, {useMemo} from 'react'
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader
} from '../../../../../../apps/editor/src/app/ui/listView'
import {TableContainer, Typography} from '@mui/material'
import {MdAdd, MdTune} from 'react-icons/all'
import {useTranslation} from 'react-i18next'
import SubscriptionFlows, {showErrors} from './subscriptionFlows'
import {useParams} from 'react-router-dom'
import {Button} from 'rsuite'
import {useMemberPlanListQuery} from '@wepublish/editor/api'
import {ApolloClient, NormalizedCacheObject} from '@apollo/client'
import {getApiClientV2} from 'apps/editor/src/app/utility'
import {useCreateSubscriptionFlowMutation} from '@wepublish/editor/api-v2'

export default function () {
  const {t} = useTranslation()

  const params = useParams()
  const {id: memberPlanId} = params

  const defaultFlowOnly = memberPlanId === 'default'

  const {data: memberPlans} = useMemberPlanListQuery({})

  const memberPlan = useMemo(() => {
    return memberPlans && memberPlans.memberPlans.nodes.find(p => p.id === memberPlanId)
  }, [memberPlanId, memberPlans])

  const client: ApolloClient<NormalizedCacheObject> = useMemo(() => getApiClientV2(), [])

  const [createSubscriptionFlow] = useCreateSubscriptionFlowMutation({
    client,
    onError: showErrors
  })

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>
            <MdTune />
            {defaultFlowOnly
              ? t('subscriptionFlow.titleDefaultSettings')
              : `${memberPlan?.name} ${t('subscriptionFlow.titleSettings')}`}
          </h2>
          <Typography variant="subtitle1">{t('subscriptionFlow.settingsDescription')}</Typography>
        </ListViewHeader>
        <ListViewActions>
          {!defaultFlowOnly && (
            <Button
              appearance="primary"
              onClick={() =>
                createSubscriptionFlow({
                  variables: {
                    subscriptionFlow: {
                      memberPlanId: memberPlanId!,
                      autoRenewal: [true, false],
                      paymentMethodIds: [],
                      periodicities: []
                    }
                  }
                })
              }>
              <MdAdd /> {t('subscriptionFlow.addNew')}
            </Button>
          )}
        </ListViewActions>
      </ListViewContainer>

      <TableContainer style={{marginTop: '16px'}}>
        <SubscriptionFlows defaultFlowOnly={defaultFlowOnly} memberPlanId={memberPlanId} />
      </TableContainer>
    </>
  )
}
