import {
  CreateCrowdfundingGoalInput,
  CreateCrowdfundingInput,
  UpdateCrowdfundingInput,
  FullCrowdfundingFragment,
  CrowdfundingGoalType,
  getApiClientV2,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { CheckPicker, Form, Panel, SelectPicker } from 'rsuite';
import { useMemberPlanListQuery } from '@wepublish/editor/api-v2';
import { CrowdfundingGoalList } from './crowdfunding-goal-list';
import {
  CurrencyInput,
  DateTimePicker,
  CrowdfundingProgressBar,
} from '@wepublish/ui/editor';
import styled from '@emotion/styled';

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
  gap: 12px;
`;

export const CrowdfundingForm = (props: CrowdfundingFormProps) => {
  const { t } = useTranslation();

  const client = getApiClientV2();
  const { data: memberPlanData } = useMemberPlanListQuery({
    client,
    variables: { take: 50 },
    fetchPolicy: 'no-cache',
  });

  const memberPlans = memberPlanData?.memberPlans?.nodes ?? [];

  return (
    <CrowdfundingFormWrapper>
      <Panel
        bordered
        style={{ overflow: 'initial' }}
      >
        <Form.Group controlId="name">
          <h3>{t('crowdfunding.form.crowdfunding')}</h3>

          <Form.ControlLabel>{t('crowdfunding.form.name')}</Form.ControlLabel>

          <Form.Control
            name="name"
            value={props.crowdfunding.name}
            onChange={value =>
              props.onChange({ ...props.crowdfunding, name: value })
            }
          />
        </Form.Group>

        <Form.Group controlId="additionalRevenue">
          <Form.ControlLabel>
            {t('crowdfunding.form.additionalRevenue')}
          </Form.ControlLabel>

          <CurrencyInput
            name="additionalRevenue"
            currency={'CHF'}
            centAmount={props.crowdfunding.additionalRevenue || 0}
            onChange={(additionalRevenue: number) =>
              props.onChange({ ...props.crowdfunding, additionalRevenue })
            }
          />
        </Form.Group>
      </Panel>

      <Panel
        bordered
        style={{ overflow: 'initial' }}
      >
        <CrowdfundingProgressBar
          crowdfunding={props.crowdfunding as Partial<FullCrowdfundingFragment>}
        />
      </Panel>

      <Panel
        bordered
        style={{ overflow: 'initial' }}
      >
        <h3>{t('crowdfunding.form.filter')}</h3>
        <Form.Group controlId="memberPlans">
          <Form.ControlLabel>
            {t('crowdfunding.form.memberPlans')}
          </Form.ControlLabel>

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
      </Panel>

      <Panel
        bordered
        style={{ overflow: 'initial' }}
      >
        <Form.Group controlId="goals">
          <h3>{t('crowdfunding.form.goals')}</h3>

          <Form.Group controlId="goalType">
            <Form.ControlLabel>
              {t('crowdfunding.form.goalType')}
            </Form.ControlLabel>

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
            goalType={
              props.crowdfunding.goalType ?? CrowdfundingGoalType.Subscription
            }
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
                  props.crowdfunding.goals?.filter((_, i) => i !== index) || [],
              })
            }
            onUpdate={(index, updatedGoal) => {
              const updatedGoals = props.crowdfunding.goals?.map((goal, i) =>
                i === index ? updatedGoal : goal
              );
              props.onChange({
                ...props.crowdfunding,
                goals: updatedGoals,
              });
            }}
          />
        </Form.Group>
      </Panel>
    </CrowdfundingFormWrapper>
  );
};
