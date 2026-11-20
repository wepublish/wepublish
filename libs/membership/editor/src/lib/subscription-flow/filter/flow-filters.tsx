import styled from '@emotion/styled';
import {
  CreateSubscriptionFlowMutationVariables,
  FullMemberPlanFragment,
  ListPaymentMethodsQuery,
  PaymentPeriodicity,
  SubscriptionFlowFragment,
  UpdateSubscriptionFlowMutationVariables,
} from '@wepublish/editor/api';
import { useAuthorisation, useFeature } from '@wepublish/ui/editor';
import { useContext, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { SubscriptionClientContext } from '../graphql-client-context';
import {
  Autocomplete,
  Button,
  FormHelperText,
  MenuItem,
  TextField,
} from '@mui/material';
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

/** Whom a flow is for, as the API stores it and as the select names it. */
const LEGACY_CHOICES = {
  all: [true, false],
  only: [true],
  none: [false],
} as const;

export type LegacyChoice = keyof typeof LEGACY_CHOICES;

export const legacyChoiceOf = (
  legacy: readonly boolean[] | undefined
): LegacyChoice =>
  !legacy || (legacy.includes(true) && legacy.includes(false)) ? 'all'
  : legacy.includes(true) ? 'only'
  : 'none';

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
  const legacyFilter = useFeature('legacy-subscriptions');
  const legacyLabelId = useId();

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
      legacy: payload.legacy ?? newFlow?.legacy,
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
        // Left out unless it changes: the API then keeps what the flow has.
        ...(payload.legacy && { legacy: payload.legacy }),
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

      {legacyFilter && (
        <Field>
          <FieldLabel id={legacyLabelId}>
            {t('subscriptionFlow.legacy')}
          </FieldLabel>

          <TextField
            select
            disabled={subscriptionFlow?.default || !canUpdateSubscriptionFlow}
            defaultValue={legacyChoiceOf(subscriptionFlow?.legacy)}
            onChange={event =>
              createOrUpdateFlow({
                legacy: [...LEGACY_CHOICES[event.target.value as LegacyChoice]],
              })
            }
            slotProps={{ select: { labelId: legacyLabelId } }}
          >
            {(Object.keys(LEGACY_CHOICES) as LegacyChoice[]).map(choice => (
              <MenuItem
                key={choice}
                value={choice}
              >
                {t(`subscriptionFlow.legacyFilter.${choice}`)}
              </MenuItem>
            ))}
          </TextField>
          <FormHelperText>{t('subscriptionFlow.legacyHint')}</FormHelperText>
        </Field>
      )}

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
