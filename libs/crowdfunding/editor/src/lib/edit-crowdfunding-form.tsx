import { useApolloClient, useMutation } from '@apollo/client/react';
import {
  CreateCrowdfundingGoalInput,
  CrowdfundingDocument,
  CrowdfundingGoalType,
  FullCrowdfundingGoalFragment,
  UpdateCrowdfundingDocument,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CrowdfundingForm,
  createCrowdfundingSchema,
  CrowdfundingFormValues,
} from './crowdfunding-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import {
  humanizeError,
  SingleViewTitle,
  enqueueSnackbar,
} from '@wepublish/ui/editor';

const showError = (error: Error): void => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const removeIdAndTypename = (goal: CreateCrowdfundingGoalInput) => {
  const { id, ...goalCleaned } = goal as FullCrowdfundingGoalFragment;
  return goalCleaned;
};

const removeTypename = ({ id }: { id: string }) => ({ id });

export const EditCrowdfundingForm = () => {
  const { id } = useParams();
  const crowdfundingId = id!;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const client = useApolloClient();

  const closePath = '/crowdfundings';

  const form = useForm<CrowdfundingFormValues>({
    resolver: zodResolver(createCrowdfundingSchema(t)),
    defaultValues: async () => {
      try {
        const { data } = await client.query({
          query: CrowdfundingDocument,
          variables: { id: crowdfundingId },
        });
        const crowdfunding = data!.crowdfunding!;

        return {
          id: crowdfundingId,
          name: crowdfunding.name,
          additionalRevenue: crowdfunding.additionalRevenue,
          goalType: crowdfunding.goalType ?? CrowdfundingGoalType.Subscription,
          memberPlans: crowdfunding.memberPlans?.map(removeTypename) ?? [],
          countSubscriptionsFrom: crowdfunding.countSubscriptionsFrom,
          countSubscriptionsUntil: crowdfunding.countSubscriptionsUntil,
          goals: crowdfunding.goals ?? [],
        } satisfies CrowdfundingFormValues;
      } catch (error) {
        showError(error as Error);

        return {
          id: crowdfundingId,
          name: '',
          goalType: CrowdfundingGoalType.Subscription,
          memberPlans: [],
          goals: [],
        } satisfies CrowdfundingFormValues;
      }
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });
  const [shouldClose, setShouldClose] = useState(false);

  const [updateCrowdfunding, { loading }] = useMutation(
    UpdateCrowdfundingDocument,
    {
      onError: showError,
      onCompleted: () => {
        if (shouldClose) {
          navigate(closePath);
        }
      },
    }
  );

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(crowdfunding =>
          updateCrowdfunding({
            variables: {
              input: {
                ...crowdfunding,
                id: crowdfundingId,
                goals: crowdfunding.goals?.map(removeIdAndTypename),
                memberPlans: crowdfunding.memberPlans ?? [],
              },
            },
          })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('crowdfunding.edit.title', {
            crowdfundingName: name,
          })}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <CrowdfundingForm />
      </form>
    </FormProvider>
  );
};
