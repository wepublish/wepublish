import React from 'react';
import {
  CreateCrowdfundingGoalInput,
  CrowdfundingGoalType,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { Form } from 'rsuite';
import { CurrencyInput } from '@wepublish/ui/editor';
import { Button, Grid } from '@mui/material';

interface CrowdfundingGoalListProps {
  goalType: CrowdfundingGoalType;
  goals: CreateCrowdfundingGoalInput[];
  onAdd: (goal: CreateCrowdfundingGoalInput) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updatedGoal: CreateCrowdfundingGoalInput) => void;
}

export const CrowdfundingGoalList = ({
  goalType,
  goals,
  onAdd,
  onRemove,
  onUpdate,
}: CrowdfundingGoalListProps) => {
  const { t } = useTranslation();

  const handleChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedGoal = { ...goals[index], [field]: value };
    onUpdate(index, updatedGoal);
  };

  return (
    <>
      <Grid
        container
        spacing={2}
      >
        <Grid
          container
          spacing={2}
        >
          <Grid size={{ xs: 3 }}>{t('crowdfunding.goalsForm.title')}</Grid>
          <Grid size={{ xs: 3 }}>
            {t('crowdfunding.goalsForm.description')}
          </Grid>
          <Grid size={{ xs: 3 }}>
            {goalType === CrowdfundingGoalType.Subscription ?
              t('crowdfunding.goalsForm.amountSubscriptions')
            : t('crowdfunding.goalsForm.amount')}
          </Grid>
          <Grid size={{ xs: 2 }}>{t('action')}</Grid>
        </Grid>

        {goals.map((goal, index) => (
          <Grid
            container
            spacing={2}
          >
            <Grid size={{ xs: 3 }}>
              <Form.Control
                name="goalTitle"
                value={goal.title}
                onChange={value => handleChange(index, 'title', value)}
              />
            </Grid>

            <Grid size={{ xs: 3 }}>
              <Form.Control
                name="goalDescription"
                value={goal.description}
                onChange={value => handleChange(index, 'description', value)}
              />
            </Grid>

            <Grid size={{ xs: 3 }}>
              {goalType === CrowdfundingGoalType.Revenue && (
                <CurrencyInput
                  name="goalAmount"
                  currency=""
                  centAmount={goal.amount}
                  onChange={value => handleChange(index, 'amount', value || 0)}
                />
              )}

              {goalType === CrowdfundingGoalType.Subscription && (
                <Form.Control
                  name="goalAmount"
                  type="number"
                  value={goal.amount}
                  onChange={value =>
                    handleChange(index, 'amount', +(value || 0))
                  }
                />
              )}
            </Grid>

            <Grid size={{ xs: 2 }}>
              <Button
                variant="outlined"
                onClick={() => onRemove(index)}
              >
                {t('crowdfunding.goalsForm.remove')}
              </Button>
            </Grid>
          </Grid>
        ))}

        <Grid
          container
          spacing={2}
        >
          <Grid size={{ xs: 12 }}>
            <Button
              variant="outlined"
              onClick={() => onAdd({ title: '', description: '', amount: 0 })}
            >
              {t('crowdfunding.goalsForm.add')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};
