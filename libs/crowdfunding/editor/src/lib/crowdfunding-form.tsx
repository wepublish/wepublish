import {
  CreateCrowdfundingGoalInput,
  CreateCrowdfundingInput,
  UpdateCrowdfundingInput
} from '@wepublish/editor/api-v2'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {CheckPicker, Form, Panel} from 'rsuite'
import {MemberPlanRefFragment, useMemberPlanListQuery} from '@wepublish/editor/api'
import React from 'react'
import {CrowdfundingGoalList} from './crowdfunding-goal-list'
import {CurrencyInput, DateTimePicker} from '../../../../ui/editor/src'
import {CrowdfundingProgressBar} from '../../../../ui/editor/src/lib/atoms/crowdfunding/CrowdfundingProgressBar'
import {FullCrowdfundingWithActiveGoalFragment} from '../../../../editor/api-v2/src'
import {MdCalendarToday} from 'react-icons/md'

type CrowdfundingFormData = (CreateCrowdfundingInput | UpdateCrowdfundingInput) & {
  goals?: CreateCrowdfundingGoalInput[] | null
}

interface CrowdfundingFormProps {
  create?: boolean
  crowdfunding: CrowdfundingFormData
  onChange: (crowdfunding: CrowdfundingFormData) => void
  onAddGoal: (goal: CreateCrowdfundingGoalInput) => void
  onRemoveGoal: (index: number) => void
}

export const CrowdfundingForm = (props: CrowdfundingFormProps) => {
  const {t} = useTranslation()
  const [memberPlans, setmemberPlans] = useState<MemberPlanRefFragment[]>([])

  const handleChange = (value: any, event: React.SyntheticEvent) => {
    const name = (event.target as HTMLInputElement).name
    props.onChange({...props.crowdfunding, [name]: value})
  }

  const {data: memberPlanData} = useMemberPlanListQuery({
    variables: {take: 50},
    fetchPolicy: 'no-cache'
  })

  useEffect(() => {
    if (memberPlanData?.memberPlans?.nodes) {
      setmemberPlans(memberPlanData.memberPlans.nodes)
    }
  }, [memberPlanData?.memberPlans])

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px'}}>
      <Panel bordered style={{overflow: 'initial'}}>
        <Form.Group controlId="name">
          <h3>Crowdfunding</h3>
          <Form.ControlLabel>{t('crowdfunding.form.name')}</Form.ControlLabel>
          <Form.Control name="name" value={props.crowdfunding.name} onChange={handleChange} />
        </Form.Group>

        <Form.Group controlId="additionalRevenue">
          <Form.ControlLabel>{t('crowdfunding.form.additionalRevenue')}</Form.ControlLabel>
          <CurrencyInput
            name="additionalRevenue"
            currency={'CHF'}
            centAmount={props.crowdfunding.additionalRevenue || 0}
            onChange={additionalRevenue =>
              props.onChange({...props.crowdfunding, additionalRevenue})
            }
          />
        </Form.Group>
      </Panel>

      <Panel bordered style={{overflow: 'initial'}}>
        <CrowdfundingProgressBar
          crowdfunding={props.crowdfunding as Partial<FullCrowdfundingWithActiveGoalFragment>}
        />
      </Panel>

      <Panel bordered style={{overflow: 'initial'}}>
        <h3>{t('crowdfunding.form.filter')}</h3>
        <Form.Group controlId="memberPlans">
          <Form.ControlLabel>{t('crowdfunding.form.memberPlans')}</Form.ControlLabel>
          <CheckPicker
            block
            virtualized
            placeholder={t('crowdfunding.form.selectMemberPlans')}
            value={props.crowdfunding.memberPlans?.map(p => p.id) || []}
            data={memberPlans.map(memberPlan => ({value: memberPlan.id!, label: memberPlan.name}))}
            onChange={ids => {
              if (!ids) return
              props.onChange({
                ...props.crowdfunding,
                memberPlans: ids.map(i => {
                  return {id: i}
                })
              })
            }}
          />
        </Form.Group>

        <Form.Group controlId="countSubscriptionsFrom">
          <Form.Control
            name="countSubscriptionsFrom"
            label={t('crowdfunding.form.countSubscriptionsFrom')}
            dateTime={
              props.crowdfunding?.countSubscriptionsFrom
                ? new Date(props.crowdfunding?.countSubscriptionsFrom)
                : undefined
            }
            changeDate={(date: Date) =>
              props.onChange({
                ...props.crowdfunding,
                countSubscriptionsFrom: date?.toISOString() || null
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
              props.crowdfunding?.countSubscriptionsUntil
                ? new Date(props.crowdfunding?.countSubscriptionsUntil)
                : undefined
            }
            changeDate={(date: Date) =>
              props.onChange({
                ...props.crowdfunding,
                countSubscriptionsUntil: date?.toISOString() || null
              })
            }
            accepter={DateTimePicker}
          />
        </Form.Group>
      </Panel>

      <Panel bordered style={{overflow: 'initial'}}>
        <Form.Group controlId="goals">
          <h3>{t('crowdfunding.form.goals')}</h3>
          <CrowdfundingGoalList
            goals={props.crowdfunding.goals || []}
            onAdd={goal =>
              props.onChange({
                ...props.crowdfunding,
                goals: [...(props.crowdfunding.goals || []), goal]
              })
            }
            onRemove={index =>
              props.onChange({
                ...props.crowdfunding,
                goals: props.crowdfunding.goals?.filter((_, i) => i !== index) || []
              })
            }
            onUpdate={(index, updatedGoal) => {
              const updatedGoals = props.crowdfunding.goals?.map((goal, i) =>
                i === index ? updatedGoal : goal
              )
              props.onChange({
                ...props.crowdfunding,
                goals: updatedGoals
              })
            }}
          />
        </Form.Group>
      </Panel>
    </div>
  )
}
