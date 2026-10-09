import { useQuery } from '@apollo/client/react';
import {
  CreateCrowdfundingGoalInput,
  CreateCrowdfundingInput,
  CrowdfundingGoalType,
  FullCrowdfundingFragment,
  MemberPlanListDocument,
  UpdateCrowdfundingInput,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { CheckPicker, Form, SelectPicker } from 'rsuite';
import { CrowdfundingGoalList } from './crowdfunding-goal-list';
import {
  CurrencyInput,
  DateTimePicker,
  CrowdfundingProgressBar,
  InfoTooltip,
} from '@wepublish/ui/editor';
import styled from '@emotion/styled';
import { Card, CardContent } from '@mui/material';

type CrowdfundingFormData = CreateCrowdfundingInput | UpdateCrowdfundingInput;

interface CrowdfundingFormProps {
  create?: boolean;
  crowdfunding: CrowdfundingFormData;
  onChange: (crowdfunding: CrowdfundingFormData) => void;
  onAddGoal: (goal: CreateCrowdfundingGoalInput) => void;
  onRemoveGoal: (index: number) => void;
}

const CrowdfundingFormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
`;

export const CrowdfundingForm = (props: CrowdfundingFormProps) => {
  const { t } = useTranslation();

  const { data: memberPlanData } = useQuery(MemberPlanListDocument, {
    variables: { take: 50 },
    fetchPolicy: 'no-cache',
  });

  const memberPlans = memberPlanData?.memberPlans?.nodes ?? [];

  const goalType =
    props.crowdfunding.goalType ?? CrowdfundingGoalType.Subscription;
  const isSubscriptionGoal = goalType === CrowdfundingGoalType.Subscription;

  return (
    <CrowdfundingFormWrapper>
      <Card
        variant="outlined"
        style={{ overflow: 'initial' }}
      >
        <CardContent>
          <Form.Stack fluid>
            <Form.Group controlId="name">
              <h3>{t('crowdfunding.form.crowdfunding')}</h3>

              <Form.Label>{t('crowdfunding.form.name')}</Form.Label>

              <Form.Control
                name="name"
                value={props.crowdfunding.name}
                onChange={value =>
                  props.onChange({ ...props.crowdfunding, name: value })
                }
              />
            </Form.Group>

            <Form.Group controlId="additionalRevenue">
              <Form.Label>
                {isSubscriptionGoal ?
                  t('crowdfunding.form.additionalSubscriptions')
                : t('crowdfunding.form.additionalRevenue')}{' '}
                <InfoTooltip
                  text={
                    isSubscriptionGoal ?
                      t('crowdfunding.form.additionalSubscriptionsInfo')
                    : t('crowdfunding.form.additionalRevenueInfo')
                  }
                />
              </Form.Label>

              {isSubscriptionGoal ?
                <Form.Control
                  name="additionalRevenue"
                  type="number"
                  value={props.crowdfunding.additionalRevenue || 0}
                  onChange={value =>
                    props.onChange({
                      ...props.crowdfunding,
                      additionalRevenue: +(value || 0),
                    })
                  }
                />
              : <CurrencyInput
                  name="additionalRevenue"
                  currency={'CHF'}
                  centAmount={props.crowdfunding.additionalRevenue || 0}
                  onChange={(additionalRevenue: number) =>
                    props.onChange({ ...props.crowdfunding, additionalRevenue })
                  }
                />
              }
            </Form.Group>
          </Form.Stack>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ overflow: 'initial' }}
      >
        <CardContent>
          <CrowdfundingProgressBar
            crowdfunding={
              props.crowdfunding as Partial<FullCrowdfundingFragment>
            }
          />
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ overflow: 'initial' }}
      >
        <CardContent>
          <h3>{t('crowdfunding.form.filter')}</h3>

          <Form.Stack fluid>
            <Form.Group controlId="memberPlans">
              <Form.Label>
                {t('crowdfunding.form.memberPlans')}{' '}
                <InfoTooltip text={t('crowdfunding.form.memberPlansInfo')} />
              </Form.Label>

              <CheckPicker
                block
                virtualized
                placeholder={t('crowdfunding.form.selectMemberPlans')}
                value={props.crowdfunding.memberPlans?.map(p => p.id) || []}
                data={memberPlans.map(memberPlan => ({
                  value: memberPlan.id!,
                  label: memberPlan.name,
                }))}
                onChange={ids => {
                  if (!ids) return;
                  props.onChange({
                    ...props.crowdfunding,
                    memberPlans: ids.map(i => {
                      return { id: i };
                    }),
                  });
                }}
              />
            </Form.Group>

            <Form.Group controlId="countSubscriptionsFrom">
              <Form.Control
                name="countSubscriptionsFrom"
                label={t('crowdfunding.form.countSubscriptionsFrom')}
                dateTime={
                  props.crowdfunding?.countSubscriptionsFrom ?
                    new Date(props.crowdfunding?.countSubscriptionsFrom)
                  : undefined
                }
                changeDate={(date: Date) =>
                  props.onChange({
                    ...props.crowdfunding,
                    countSubscriptionsFrom: date?.toISOString() || null,
                  })
                }
                accepter={DateTimePicker}
              />
            </Form.Group>

            <Form.Group controlId="countSubscriptionsUntil">
              <Form.Control
                name="countSubscriptionsUntil"
                label={t('crowdfunding.form.countSubscriptionsUntil')}
                dateTime={
                  props.crowdfunding?.countSubscriptionsUntil ?
                    new Date(props.crowdfunding?.countSubscriptionsUntil)
                  : undefined
                }
                changeDate={(date: Date) =>
                  props.onChange({
                    ...props.crowdfunding,
                    countSubscriptionsUntil: date?.toISOString() || null,
                  })
                }
                accepter={DateTimePicker}
              />
            </Form.Group>
          </Form.Stack>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ overflow: 'initial' }}
      >
        <CardContent>
          <Form.Stack fluid>
            <Form.Group controlId="goals">
              <h3>
                {t('crowdfunding.form.goals')}{' '}
                <InfoTooltip text={t('crowdfunding.form.goalsInfo')} />
              </h3>

              <Form.Group controlId="goalType">
                <Form.Label>
                  {t('crowdfunding.form.goalType')}{' '}
                  <InfoTooltip text={t('crowdfunding.form.goalTypeInfo')} />
                </Form.Label>

                <SelectPicker
                  cleanable={false}
                  value={props.crowdfunding.goalType}
                  onChange={(value: CrowdfundingGoalType | null) =>
                    props.onChange({ ...props.crowdfunding, goalType: value! })
                  }
                  data={Object.entries(CrowdfundingGoalType).map(
                    ([label, value]) => ({
                      label: t(`crowdfunding.form.goalType_${label}`),
                      value,
                    })
                  )}
                />
              </Form.Group>

              <CrowdfundingGoalList
                goalType={goalType}
                goals={props.crowdfunding.goals || []}
                onAdd={goal =>
                  props.onChange({
                    ...props.crowdfunding,
                    goals: [...(props.crowdfunding.goals || []), goal],
                  })
                }
                onRemove={index =>
                  props.onChange({
                    ...props.crowdfunding,
                    goals:
                      props.crowdfunding.goals?.filter((_, i) => i !== index) ||
                      [],
                  })
                }
                onUpdate={(index, updatedGoal) => {
                  const updatedGoals = props.crowdfunding.goals?.map(
                    (goal, i) => (i === index ? updatedGoal : goal)
                  );
                  props.onChange({
                    ...props.crowdfunding,
                    goals: updatedGoals,
                  });
                }}
              />
            </Form.Group>
          </Form.Stack>
        </CardContent>
      </Card>
    </CrowdfundingFormWrapper>
  );
};
