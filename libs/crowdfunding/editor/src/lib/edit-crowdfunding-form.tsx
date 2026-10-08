import { useMutation, useQuery } from '@apollo/client/react';
import {
  CreateCrowdfundingGoalInput,
  CrowdfundingDocument,
  FullCrowdfundingGoalFragment,
  UpdateCrowdfundingDocument,
  UpdateCrowdfundingInput,
} from '@wepublish/editor/api';
import { useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { CrowdfundingForm } from './crowdfunding-form';
import { humanizeError, SingleViewTitle } from '@wepublish/ui/editor';
import { Form, Message, Schema, toaster } from 'rsuite';

const showError = (error: Error): void => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={8000}
    >
      {humanizeError(error)}
    </Message>
  );
};

export const EditCrowdfundingForm = () => {
  const { id } = useParams();
  const crowdfundingId = id!;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/crowdfundings';

  const [crowdfunding, setCrowdfunding] = useReducer(
    (
      state: UpdateCrowdfundingInput,
      action: Partial<UpdateCrowdfundingInput>
    ) => ({
      ...state,
      ...action,
    }),
    {
      id: crowdfundingId,
      name: '',
    }
  );

  const { data: crowdfundingData, error: crowdfundingError } = useQuery(
    CrowdfundingDocument,
    {
      variables: {
        id: id!,
      },
      skip: !id,
    }
  );

  useEffect(() => {
    if (crowdfundingError) {
      showError(crowdfundingError);
    }
  }, [crowdfundingError]);

  useEffect(() => {
    if (crowdfundingData) {
      setCrowdfunding(crowdfundingData.crowdfunding);
    }
  }, [crowdfundingData]);

  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(),
  });

  const [shouldClose, setShouldClose] = useState(false);

  const [updateCrowdfunding, { loading }] = useMutation(
    UpdateCrowdfundingDocument,
    {
      onError: showError,
      onCompleted: data => {
        setCrowdfunding(data.updateCrowdfunding);

        if (shouldClose) {
          navigate(closePath);
        }
      },
    }
  );

  const onSubmit = () => {
    const processedCrowdfunding = {
      ...crowdfunding,
      goals: crowdfunding.goals?.map(removeIdAndTypename),
      memberPlans: crowdfunding.memberPlans || [],
      revenue: undefined,
      subscriptions: undefined,
      activeGoal: undefined,
    };

    updateCrowdfunding({ variables: { input: processedCrowdfunding } });
  };

  const removeIdAndTypename = (goal: CreateCrowdfundingGoalInput) => {
    const { id, ...goalCleaned } = goal as FullCrowdfundingGoalFragment;
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
        title={t('crowdfunding.edit.title', {
          crowdfundingName: crowdfunding.name,
        })}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <CrowdfundingForm
        crowdfunding={crowdfunding}
        onChange={changes =>
          setCrowdfunding({ ...changes, id: crowdfunding.id })
        }
        onAddGoal={handleAddGoal}
        onRemoveGoal={handleRemoveGoal}
      />
    </Form>
  );
};
