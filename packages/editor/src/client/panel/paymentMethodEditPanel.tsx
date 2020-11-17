import React, {useState, useEffect} from 'react'

import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Panel,
  Alert,
  Toggle,
  HelpBlock,
  SelectPicker
} from 'rsuite'

import {RichTextBlock, createDefaultValue} from '../blocks/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'
import 'react-input-range/lib/css/index.css'
import {
  FullPaymentMethodFragment,
  useCreatePaymentMethodMutation,
  usePaymentMethodQuery,
  useUpdatePaymentMethodMutation
} from '../api'

import {useTranslation} from 'react-i18next'

export interface PaymentMethodEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(paymentMethod: FullPaymentMethodFragment): void
}

export function PaymentMethodEditPanel({id, onClose, onSave}: PaymentMethodEditPanelProps) {
  const {t} = useTranslation()

  const [name, setName] = useState('')
  const [description, setDescription] = useState<RichTextBlockValue>(createDefaultValue())
  const [isActive, setIsActive] = useState<boolean>(false)
  const [paymentAdapter, setPaymentAdapter] = useState<string>('')

  const {data, loading: isLoading, error: loadError} = usePaymentMethodQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id == undefined
  })

  const [
    createPaymentMethod,
    {loading: isCreating, error: createError}
  ] = useCreatePaymentMethodMutation()

  const [
    updatePaymentMethod,
    {loading: isUpdating, error: updateError}
  ] = useUpdatePaymentMethodMutation()

  const isDisabled = isLoading || isCreating || isUpdating || loadError != undefined

  useEffect(() => {
    if (data?.paymentMethod) {
      setName(data.paymentMethod.name)
      setDescription(data.paymentMethod.description)
      setIsActive(data.paymentMethod.active)
      setPaymentAdapter(data.paymentMethod.paymentAdapter)
    }
  }, [data?.paymentMethod])

  useEffect(() => {
    const error = loadError?.message ?? createError?.message ?? updateError?.message
    if (error) Alert.error(error, 0)
  }, [loadError, createError, updateError])

  async function handleSave() {
    if (id) {
      const {data} = await updatePaymentMethod({
        variables: {
          id,
          input: {
            name,
            description,
            active: isActive,
            paymentAdapter
          }
        }
      })

      if (data?.updatePaymentMethod) onSave?.(data.updatePaymentMethod)
    } else {
      const {data} = await createPaymentMethod({
        variables: {
          input: {
            name,
            description,
            active: isActive,
            paymentAdapter
          }
        }
      })

      if (data?.createPaymentMethod) onSave?.(data.createPaymentMethod)
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('paymentMethodList.editTitle') : t('paymentMethodList.createTitle')}
        </Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('paymentMethodList.name')}</ControlLabel>
              <FormControl
                name={t('paymentMethodList.name')}
                value={name}
                disabled={isDisabled}
                onChange={value => {
                  setName(value)
                }}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('paymentMethodList.active')}</ControlLabel>
              <Toggle
                checked={isActive}
                disabled={isDisabled}
                onChange={value => setIsActive(value)}
              />
              <HelpBlock>{t('paymentMethodList.activeDescription')}</HelpBlock>
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('paymentMethodList.adapter')}</ControlLabel>
              <SelectPicker
                value={paymentAdapter}
                data={['cc', 'payrexx'].map(pa => ({value: pa, label: pa}))}
                searchable={false}
                block={true}
                onChange={value => setPaymentAdapter(value)}
              />
            </FormGroup>
          </Form>
        </Panel>
        <Panel header={t('authors.panels.bioInformation')}>
          <RichTextBlock value={description} onChange={value => setDescription(value)} />
        </Panel>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
          {id ? t('save') : t('create')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
