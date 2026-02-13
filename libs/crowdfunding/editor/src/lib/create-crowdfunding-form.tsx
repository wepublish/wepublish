import {
  CreateCrowdfundingGoalInput,
  CreateCrowdfundingInput,
  useCreateCrowdfundingMutation,
  CreateCrowdfundingMutation,
} from '@wepublish/editor/api';
import { useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CrowdfundingForm } from './crowdfunding-form';
import { SingleViewTitle } from '@wepublish/ui/editor';
import { Form, Message, Schema, toaster } from 'rsuite';
import { ApolloError } from '@apollo/client';

const showError = (error: ApolloError): void => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={3000}
    >
      {error.message}
    </Message>
  );
};

export const CreateCrowdfundingForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/crowdfundings';

  const [crowdfunding, setCrowdfunding] = useReducer(
    (
      state: CreateCrowdfundingInput,
      action: Partial<CreateCrowdfundingInput>
    ) => ({
      ...state,
      ...action,
    }),
    {} as CreateCrowdfundingInput
  );

  const [shouldClose, setShouldClose] = useState(false);

  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(),
  });

  const [createCrowdfunding, { loading }] = useCreateCrowdfundingMutation({
    onError: showError,
    onCompleted: (crowdfunding: CreateCrowdfundingMutation) => {
      if (shouldClose) {
        navigate(closePath);
      } else {
        navigate(`/crowdfundings/edit/${crowdfunding.createCrowdfunding.id}`);
      }
    },
  });

  const onSubmit = () => {
    const processedCrowdfunding = {
      ...crowdfunding,
      goals: crowdfunding.goals?.map(removeIdAndTypename),
    };
    createCrowdfunding({ variables: { input: processedCrowdfunding } });
  };

  const removeIdAndTypename = (goal: CreateCrowdfundingGoalInput) => {
    const { id, __typename, ...goalCleaned } = goal as any;
    return goalCleaned;
  };

  const handleAddGoal = (goal: CreateCrowdfundingGoalInput) => {
    setCrowdfunding({
      goals: [...(crowdfunding.goals || []), goal],
    });
  };

  const handleRemoveGoal = (index: number) => {
    setCrowdfunding({
      goals: crowdfunding.goals?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <Form
      fluid
      formValue={crowdfunding}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
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

      <CrowdfundingForm
        create
        crowdfunding={crowdfunding}
        onChange={changes =>
          setCrowdfunding(changes as CreateCrowdfundingInput)
        }
        onAddGoal={handleAddGoal}
        onRemoveGoal={handleRemoveGoal}
      />
    </Form>
  );
};
