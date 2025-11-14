import React from 'react';
import {
  CreateCrowdfundingGoalInput,
  CrowdfundingGoalType,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { Button, Col, Form, Grid, Row } from 'rsuite';
import { CurrencyInput } from '@wepublish/ui/editor';

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
      <Grid fluid>
        <Row>
          <Col xs={5}>{t('crowdfunding.goalsForm.title')}</Col>
          <Col xs={5}>{t('crowdfunding.goalsForm.description')}</Col>
          <Col xs={5}>{t('crowdfunding.goalsForm.amount')}</Col>
          <Col xs={4}>{t('crowdfunding.goalsForm.remove')}</Col>
        </Row>
        {goals.map((goal, index) => (
          <Row>
            <Col xs={5}>
              <Form.Control
                name="goalTitle"
                value={goal.title}
                onChange={value => handleChange(index, 'title', value)}
              />
            </Col>
            <Col xs={5}>
              <Form.Control
                name="goalDescription"
                value={goal.description}
                onChange={value => handleChange(index, 'description', value)}
              />
            </Col>
            <Col xs={5}>
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
            </Col>
            <Col xs={4}>
              <Button onClick={() => onRemove(index)}>
                {t('crowdfunding.goalsForm.remove')}
              </Button>
            </Col>
          </Row>
        ))}

        <Row>
          <Col xs={24}>
            <Button
              onClick={() => onAdd({ title: '', description: '', amount: 0 })}
            >
              {t('crowdfunding.goalsForm.add')}
            </Button>
          </Col>
        </Row>
      </Grid>
    </>
  );
};
