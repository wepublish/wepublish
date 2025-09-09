import {TagType, useCreateTagMutation} from '@wepublish/editor/api'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Form, Message, Schema, Toggle, toaster} from 'rsuite'

interface TagCreateFormProps {
  type: TagType
  onSuccess?: () => void
  onCancel?: () => void
}

export function TagCreateForm({type, onSuccess, onCancel}: TagCreateFormProps) {
  const {t} = useTranslation()
  const [formValue, setFormValue] = useState<{tag: string; main: boolean}>({
    tag: '',
    main: false
  })

  const [createTag, {loading: isCreating}] = useCreateTagMutation({
    onError: error => {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {error.message}
        </Message>
      )
    },
    onCompleted(createdTag) {
      if (!createdTag.createTag) {
        return
      }

      setFormValue({tag: '', main: false})
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('tags.overview.createSuccess')}
        </Message>
      )
      onSuccess?.()
    }
  })

  return (
    <Form
      fluid
      formValue={formValue}
      model={Schema.Model({
        tag: Schema.Types.StringType().isRequired(t('tags.overview.tagRequired'))
      })}
      onSubmit={validationPassed => {
        if (validationPassed) {
          createTag({
            variables: {
              tag: formValue.tag,
              main: formValue.main,
              type
            }
          })
        }
      }}
      onChange={(formValue: any) => setFormValue(formValue)}>
      <Form.Group>
        <Form.ControlLabel>{t('tags.overview.name')}</Form.ControlLabel>
        <Form.Control name="tag" placeholder={t('tags.overview.placeholder')} />
      </Form.Group>
      <Form.Group>
        <Form.ControlLabel>{t('tags.overview.mainTag')}</Form.ControlLabel>
        <Form.Control name="main" accepter={Toggle} />
        <Form.HelpText>{t('tags.overview.mainTagHelp')}</Form.HelpText>
      </Form.Group>
      <Form.Group>
        <Button appearance="primary" type="submit" disabled={isCreating} loading={isCreating}>
          {t('create')}
        </Button>
        <Button appearance="subtle" onClick={onCancel} style={{marginLeft: '10px'}}>
          {t('cancel')}
        </Button>
      </Form.Group>
    </Form>
  )
}
