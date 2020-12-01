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

import {
  FullPaymentMethodFragment,
  FullPaymentProviderFragment,
  useCreatePaymentMethodMutation,
  usePaymentMethodQuery,
  usePaymentProviderListQuery,
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
  const [paymentProvider, setPaymentProvider] = useState<FullPaymentProviderFragment>()
  const [paymentProviders, setPaymentProviders] = useState<FullPaymentProviderFragment[]>([])

  const {data, loading: isLoading, error: loadError} = usePaymentMethodQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const {
    data: paymentProviderData,
    loading: isLoadingPaymentProvider,
    error: loadPaymentProviderError
  } = usePaymentProviderListQuery({
    fetchPolicy: 'network-only'
  })

  const [
    createPaymentMethod,
    {loading: isCreating, error: createError}
  ] = useCreatePaymentMethodMutation()

  const [
    updatePaymentMethod,
    {loading: isUpdating, error: updateError}
  ] = useUpdatePaymentMethodMutation()

  const isDisabled =
    isLoading ||
    isCreating ||
    isUpdating ||
    isLoadingPaymentProvider ||
    loadError !== undefined ||
    loadPaymentProviderError !== undefined

  useEffect(() => {
    if (data?.paymentMethod) {
      setName(data.paymentMethod.name)
      setDescription(data.paymentMethod.description)
      setIsActive(data.paymentMethod.active)
      setPaymentProvider(data.paymentMethod.paymentProvider)
    }
  }, [data?.paymentMethod])

  useEffect(() => {
    if (paymentProviderData?.paymentProviders) {
      setPaymentProviders(paymentProviderData.paymentProviders)
    }
  }, [paymentProviderData?.paymentProviders])

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      loadPaymentProviderError?.message
    if (error) Alert.error(error, 0)
  }, [loadError, createError, updateError, loadPaymentProviderError])

  async function handleSave() {
    if (!paymentProvider) {
      return //TODO: handle validation
    }

    if (id) {
      const {data} = await updatePaymentMethod({
        variables: {
          id,
          input: {
            name,
            description,
            active: isActive,
            paymentProviderID: paymentProvider.id
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
            paymentProviderID: paymentProvider.id
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
                value={paymentProvider?.id}
                data={paymentProviders.map(pp => ({value: pp.id, label: pp.name}))}
                searchable={false}
                block={true}
                onChange={value => setPaymentProvider(paymentProviders.find(pp => pp.id === value))}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('paymentMethodList.description')}</ControlLabel>
              <RichTextBlock value={description} onChange={value => setDescription(value)} />
            </FormGroup>
          </Form>
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
