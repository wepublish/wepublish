import {
  Tag as GraphqlTag,
  TagType,
  useCreateTagMutation,
  useUpdateTagMutation
} from '@wepublish/editor/api'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Form, Message, Schema, toaster, Toggle} from 'rsuite'

type Tag = Omit<GraphqlTag, 'url'>

interface TagCreateFormProps {
  type: TagType
  initialData?: Tag
  onSuccess?: () => void
  onCancel?: () => void
}

export function TagForm({type, initialData, onSuccess, onCancel}: TagCreateFormProps) {
  const {t} = useTranslation()
  const [formValue, setFormValue] = useState<{tag: string; main: boolean}>({
    tag: initialData?.tag || '',
    main: initialData?.main || false
  })

  const isEditing = !!initialData

  useEffect(() => {
    if (initialData) {
      setFormValue({
        tag: initialData.tag || '',
        main: initialData.main || false
      })
    }
  }, [initialData])

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

  const [updateTag, {loading: isUpdating}] = useUpdateTagMutation({
    onError: error => {
      toaster.push(
        <Message type="error" showIcon closable duration={3000}>
          {error.message}
        </Message>
      )
    },
    onCompleted(updatedTag) {
      if (!updatedTag.updateTag) {
        return
      }

      setFormValue({tag: '', main: false})
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('tags.overview.updateSuccess')}
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
          if (isEditing && initialData) {
            updateTag({
              variables: {
                id: initialData.id,
                tag: formValue.tag,
                main: formValue.main
              }
            })
          } else {
            createTag({
              variables: {
                tag: formValue.tag,
                main: formValue.main,
                type
              }
            })
          }
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
        <Button
          appearance="primary"
          type="submit"
          disabled={isCreating || isUpdating}
          loading={isCreating || isUpdating}>
          {isEditing ? t('save') : t('create')}
        </Button>
        <Button appearance="subtle" onClick={onCancel} style={{marginLeft: '10px'}}>
          {t('cancel')}
        </Button>
      </Form.Group>
    </Form>
  )
}
