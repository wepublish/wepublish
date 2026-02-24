import { TableCell } from '@mui/material';
import {
  ListPaymentMethodsQuery,
  PaymentPeriodicity,
  CreateSubscriptionFlowMutationVariables,
  UpdateSubscriptionFlowMutationVariables,
  SubscriptionFlowFragment,
  FullMemberPlanFragment,
} from '@wepublish/editor/api';
import { useAuthorisation } from '@wepublish/ui/editor';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { Badge, CheckPicker, IconButton } from 'rsuite';
import { SubscriptionClientContext } from '../graphql-client-context';

interface FilterBodyProps {
  memberPlan: FullMemberPlanFragment;
  subscriptionFlow?: SubscriptionFlowFragment;
  createNewFlow?: boolean;
  paymentMethods: ListPaymentMethodsQuery | undefined;
}

export function FilterBody({
  subscriptionFlow,
  memberPlan,
  createNewFlow,
  paymentMethods,
}: FilterBodyProps) {
  const { t } = useTranslation();
  const canUpdateSubscriptionFlow = useAuthorisation(
    'CAN_UPDATE_SUBSCRIPTION_FLOW'
  );
  const [newFlow, setNewFlow] =
    useState<CreateSubscriptionFlowMutationVariables>();
  const client = useContext(SubscriptionClientContext);

  function updateNewFlow(
    payload: Partial<UpdateSubscriptionFlowMutationVariables>
  ) {
    const oldFlow = newFlow ?? {
      autoRenewal: [],
      periodicities: [],
      paymentMethodIds: [],
    };

    setNewFlow({
      memberPlanId: memberPlan.id,
      paymentMethodIds: payload.paymentMethodIds || oldFlow.paymentMethodIds,
      periodicities: payload.periodicities || oldFlow.periodicities,
      autoRenewal: payload.autoRenewal || oldFlow.autoRenewal,
    });
  }

  async function updateFlow(
    payload: Partial<UpdateSubscriptionFlowMutationVariables>
  ) {
    if (!subscriptionFlow) {
      return;
    }

    await client.updateSubscriptionFlow({
      variables: {
        id: subscriptionFlow.id,
        paymentMethodIds:
          payload.paymentMethodIds ||
          subscriptionFlow.paymentMethods.map(pm => pm.id),
        periodicities: payload.periodicities || subscriptionFlow.periodicities,
        autoRenewal: payload.autoRenewal || subscriptionFlow.autoRenewal,
      },
    });
  }

  async function createOrUpdateFlow(
    payload: Partial<UpdateSubscriptionFlowMutationVariables>
  ) {
    if (createNewFlow) {
      updateNewFlow(payload);
    } else {
      await updateFlow(payload);
    }
  }

  function saveNewFlow() {
    if (!newFlow) {
      return;
    }

    return client.createSubscriptionFlow({
      variables: newFlow,
    });
  }

  return (
    <>
      <TableCell align="center">
        {subscriptionFlow && (
          <>
            <Badge
              color={subscriptionFlow?.numberOfSubscriptions ? 'green' : 'red'}
              content={
                <div style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                  {t('subscriptionFlow.subscriptionsAffected', {
                    numberOfSubscriptions:
                      subscriptionFlow?.numberOfSubscriptions,
                  })}
                </div>
              }
            />

            <div style={{ marginTop: '5px' }}>
              {!subscriptionFlow?.default && memberPlan.name}
            </div>
          </>
        )}
      </TableCell>

      <TableCell align="center">
        {paymentMethods && paymentMethods.paymentMethods && (
          <CheckPicker
            data={paymentMethods.paymentMethods.map(method => ({
              label: method.name,
              value: method.id,
            }))}
            disabled={
              subscriptionFlow?.default ||
              paymentMethods.paymentMethods.length === 0 ||
              !canUpdateSubscriptionFlow
            }
            countable={false}
            cleanable={false}
            defaultValue={subscriptionFlow?.paymentMethods.map(m => m.id)}
            onChange={v => createOrUpdateFlow({ paymentMethodIds: v })}
          />
        )}
      </TableCell>

      <TableCell align="center">
        <CheckPicker
          data={Object.values(PaymentPeriodicity).map(item => ({
            label: item,
            value: item,
          }))}
          disabled={subscriptionFlow?.default || !canUpdateSubscriptionFlow}
          countable={false}
          cleanable={false}
          defaultValue={subscriptionFlow?.periodicities || []}
          onChange={v => createOrUpdateFlow({ periodicities: v })}
        />
      </TableCell>

      <TableCell align="center">
        <CheckPicker
          data={[true, false].map(item => ({
            label: t(`subscriptionFlow.booleanFilter.${item}`),
            value: item,
          }))}
          disabled={subscriptionFlow?.default || !canUpdateSubscriptionFlow}
          countable={false}
          cleanable={false}
          defaultValue={subscriptionFlow?.autoRenewal || []}
          onChange={v => createOrUpdateFlow({ autoRenewal: v })}
        />
      </TableCell>

      {createNewFlow && (
        <TableCell>
          <IconButton
            icon={<MdAdd />}
            color={'green'}
            appearance={'primary'}
            onClick={saveNewFlow}
          >
            {t('subscriptionFlow.addNew')}
          </IconButton>
        </TableCell>
      )}
    </>
  );
}
