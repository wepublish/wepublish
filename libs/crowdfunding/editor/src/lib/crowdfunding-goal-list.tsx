import React from 'react'
import {CreateCrowdfundingGoalInput} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import {Button, Col, Form, Grid, Row} from 'rsuite'

interface CrowdfundingGoalListProps {
  goals: CreateCrowdfundingGoalInput[]
  onAdd: (goal: CreateCrowdfundingGoalInput) => void
  onRemove: (index: number) => void
  onUpdate: (index: number, updatedGoal: CreateCrowdfundingGoalInput) => void
}

export const CrowdfundingGoalList = ({
  goals,
  onAdd,
  onRemove,
  onUpdate
}: CrowdfundingGoalListProps) => {
  const {t} = useTranslation()

  const handleChange = (index: number, field: string, value: string) => {
    const updatedGoal = {...goals[index], [field]: value}
    onUpdate(index, updatedGoal)
  }

  return (
    <>
      <Grid fluid>
        <Row>
          <Col xs={5}>Title</Col>
          <Col xs={5}>Description</Col>
          <Col xs={5}>Amount</Col>
          <Col xs={4}>Goals</Col>
        </Row>
        {goals.map((goal, index) => (
          <Row>
            <Col xs={5}>
              <Form.Control
                name="title"
                value={goal.title}
                onChange={value => handleChange(index, 'title', value)}
              />
            </Col>
            <Col xs={5}>
              <Form.Control
                name="description"
                value={goal.description}
                onChange={value => handleChange(index, 'description', value)}
              />
            </Col>
            <Col xs={5}>
              <Form.Control
                name="amount"
                value={goal.amount}
                onChange={value => handleChange(index, 'amount', value)}
              />
            </Col>
            <Col xs={4}>
              <Button onClick={() => onRemove(index)}>Remove</Button>
            </Col>
          </Row>
        ))}

        <Row>
          <Col xs={24}>
            <Button onClick={() => onAdd({title: '', description: '', amount: 0})}>Add Goal</Button>
          </Col>
        </Row>
      </Grid>
    </>
  )
}
