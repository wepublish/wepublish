import {CreateBannerActionInput} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import {Button, Col, Form, Grid, Row} from 'rsuite'

interface BannerActionListProps {
  actions: CreateBannerActionInput[]
  onAdd: (action: CreateBannerActionInput) => void
  onRemove: (index: number) => void
  onUpdate: (index: number, updatedAction: CreateBannerActionInput) => void
}

export const BannerActionList = ({actions, onAdd, onRemove, onUpdate}: BannerActionListProps) => {
  const {t} = useTranslation()

  const handleChange = (index: number, field: string, value: string) => {
    const updatedAction = {...actions[index], [field]: value}
    onUpdate(index, updatedAction)
  }

  return (
    <>
      <Grid fluid>
        <Row>
          <Col xs={6}>Label</Col>
          <Col xs={6}>URL</Col>
          <Col xs={6}>Style</Col>
          <Col xs={6}>Actions</Col>
        </Row>
        {actions.map((action, index) => (
          <Row>
            <Col xs={6}>
              <Form.Control
                name="label"
                value={action.label}
                onChange={value => handleChange(index, 'label', value)}
              />
            </Col>
            <Col xs={6}>
              <Form.Control
                name="url"
                value={action.url}
                onChange={value => handleChange(index, 'url', value)}
              />
            </Col>
            <Col xs={6}>
              <Form.Control
                name="style"
                value={action.style}
                onChange={value => handleChange(index, 'style', value)}
              />
            </Col>
            <Col xs={6}>
              <Button onClick={() => onRemove(index)}>Remove</Button>
            </Col>
          </Row>
        ))}

        <Row>
          <Col xs={24}>
            <Button onClick={() => onAdd({label: '', url: '', style: ''})}>Add Action</Button>
          </Col>
        </Row>
      </Grid>
    </>
  )
}
