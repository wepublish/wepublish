import styled from '@emotion/styled';
import {
  CreateSubscriptionFlowMutationVariables,
  FullMemberPlanFragment,
  ListPaymentMethodsQuery,
  PaymentPeriodicity,
  SubscriptionFlowFragment,
  UpdateSubscriptionFlowMutationVariables,
} from '@wepublish/editor/api';
import { useAuthorisation } from '@wepublish/ui/editor';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { SubscriptionClientContext } from '../graphql-client-context';
import { Autocomplete, Button, TextField } from '@mui/material';
import { CanUpdateSubscriptionFlow } from '@wepublish/permissions';

const FilterGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px 16px;
  padding: 12px 20px 16px;
`;

const Field = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const FieldLabel = styled('span')`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.vars.palette.text.primary};
`;

const CreateAction = styled('div')`
  display: flex;
  justify-content: flex-end;
  grid-column: 1 / -1;
`;

interface FlowFiltersProps {
  memberPlan: FullMemberPlanFragment;
  subscriptionFlow?: SubscriptionFlowFragment;
  createNewFlow?: boolean;
  paymentMethods: ListPaymentMethodsQuery | undefined;
}

export function FlowFilters({
  subscriptionFlow,
  memberPlan,
  createNewFlow,
  paymentMethods,
}: FlowFiltersProps) {
  const { t } = useTranslation();
  const canUpdateSubscriptionFlow = useAuthorisation(
    CanUpdateSubscriptionFlow.id
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
    <FilterGrid>
      {paymentMethods?.paymentMethods && (
        <Field>
          <FieldLabel>{t('subscriptionFlow.paymentMethod')}</FieldLabel>

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={paymentMethods.paymentMethods.map(method => method.id)}
            getOptionLabel={id =>
              paymentMethods.paymentMethods.find(method => method.id === id)
                ?.name ?? id
            }
            disabled={
              subscriptionFlow?.default ||
              paymentMethods.paymentMethods.length === 0 ||
              !canUpdateSubscriptionFlow
            }
            defaultValue={subscriptionFlow?.paymentMethods.map(m => m.id) ?? []}
            onChange={(_event, value) =>
              createOrUpdateFlow({ paymentMethodIds: value })
            }
            renderInput={params => <TextField {...params} />}
          />
        </Field>
      )}

      <Field>
        <FieldLabel>{t('subscriptionFlow.periodicity')}</FieldLabel>

        <Autocomplete
          multiple
          disableCloseOnSelect
          options={Object.values(PaymentPeriodicity)}
          getOptionLabel={item =>
            t(`memberPlanList.paymentPeriodicity.${item}`)
          }
          disabled={subscriptionFlow?.default || !canUpdateSubscriptionFlow}
          defaultValue={subscriptionFlow?.periodicities || []}
          onChange={(_event, value) =>
            createOrUpdateFlow({ periodicities: value })
          }
          renderInput={params => <TextField {...params} />}
        />
      </Field>

      <Field>
        <FieldLabel>{t('subscriptionFlow.autoRenewal')}</FieldLabel>

        <Autocomplete
          multiple
          disableCloseOnSelect
          options={[true, false]}
          getOptionLabel={item => t(`subscriptionFlow.booleanFilter.${item}`)}
          disabled={subscriptionFlow?.default || !canUpdateSubscriptionFlow}
          defaultValue={subscriptionFlow?.autoRenewal || []}
          onChange={(_event, value) =>
            createOrUpdateFlow({ autoRenewal: value })
          }
          renderInput={params => <TextField {...params} />}
        />
      </Field>

      {createNewFlow && (
        <CreateAction>
          <Button
            variant="contained"
            color="success"
            startIcon={<MdAdd />}
            onClick={saveNewFlow}
          >
            {t('subscriptionFlow.addNew')}
          </Button>
        </CreateAction>
      )}
    </FilterGrid>
  );
}
