import {BannerAction, CreateBannerActionInput} from '@wepublish/editor/api-v2'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Form, Input, List} from 'rsuite'

interface BannerActionListProps {
  actions: CreateBannerActionInput[]
  onAdd: (action: CreateBannerActionInput) => void
  onRemove: (index: number) => void
}

export const BannerActionList = ({actions, onAdd, onRemove}: BannerActionListProps) => {
  const {t} = useTranslation()
  const [newAction, setNewAction] = useState<CreateBannerActionInput>({
    label: '',
    url: '',
    style: ''
  })

  const handleAdd = () => {
    onAdd(newAction)
    setNewAction({label: '', url: '', style: ''})
  }

  return (
    <>
      <List>
        {actions.map((action, index) => (
          <List.Item key={index} style={{display: 'flex', justifyContent: 'space-between'}}>
            <span>
              {action.label} - {action.url}
            </span>
            <Button onClick={() => onRemove(index)}>Remove</Button>
          </List.Item>
        ))}
      </List>
      <h4 className="my-3">{t('banner.form.action.add')}</h4>
      <Form.Group controlId="label">
        <Form.ControlLabel>{t('banner.form.action.label')}</Form.ControlLabel>
        <Form.Control
          name="label"
          value={newAction.label}
          onChange={value => setNewAction({...newAction, label: value})}
        />
      </Form.Group>
      <Form.Group controlId="url">
        <Form.ControlLabel>{t('banner.form.action.url')}</Form.ControlLabel>
        <Form.Control
          name="url"
          value={newAction.url}
          onChange={value => setNewAction({...newAction, url: value})}
        />
      </Form.Group>
      <Form.Group controlId="style">
        <Form.ControlLabel>{t('banner.form.action.style')}</Form.ControlLabel>
        <Form.Control
          name="style"
          value={newAction.style}
          onChange={value => setNewAction({...newAction, style: value})}
        />
      </Form.Group>
      <Button onClick={handleAdd}>Add Action</Button>
    </>
  )
}
