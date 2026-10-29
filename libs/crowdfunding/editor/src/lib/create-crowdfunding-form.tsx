import { useMutation } from '@apollo/client/react';
import {
  CreateCrowdfundingDocument,
  CreateCrowdfundingGoalInput,
  CreateCrowdfundingMutation,
  CrowdfundingGoalType,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CrowdfundingForm,
  createCrowdfundingSchema,
  CrowdfundingFormValues,
} from './crowdfunding-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
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
  const { id, __typename, ...goalCleaned } =
    goal as CreateCrowdfundingGoalInput & {
      id?: string;
      __typename?: string;
    };
  return goalCleaned;
};

const EMPTY_CROWDFUNDING = {
  name: '',
  goalType: CrowdfundingGoalType.Subscription,
  memberPlans: [],
  goals: [],
} satisfies CrowdfundingFormValues;

export const CreateCrowdfundingForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/crowdfundings';

  const form = useForm<CrowdfundingFormValues>({
    resolver: zodResolver(createCrowdfundingSchema(t)),
    defaultValues: EMPTY_CROWDFUNDING,
  });

  const [shouldClose, setShouldClose] = useState(false);

  const [createCrowdfunding, { loading }] = useMutation(
    CreateCrowdfundingDocument,
    {
      onError: showError,
      onCompleted: (crowdfunding: CreateCrowdfundingMutation) => {
        if (shouldClose) {
          navigate(closePath);
        } else {
          navigate(`/crowdfundings/edit/${crowdfunding.createCrowdfunding.id}`);
        }
      },
    }
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ id, ...crowdfunding }) =>
          createCrowdfunding({
            variables: {
              input: {
                ...crowdfunding,
                goals: crowdfunding.goals?.map(removeIdAndTypename),
              },
            },
          })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('crowdfunding.create.title')}
          loadingTitle={t('crowdfunding.create.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <CrowdfundingForm create />
      </form>
    </FormProvider>
  );
};
