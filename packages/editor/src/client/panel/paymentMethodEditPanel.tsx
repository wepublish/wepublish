import React, {useState, useEffect} from 'react'

import {Button, Drawer, Form, Panel, toaster, Message, Toggle, SelectPicker, Schema} from 'rsuite'

import {
  FullPaymentMethodFragment,
  FullPaymentProviderFragment,
  useCreatePaymentMethodMutation,
  usePaymentMethodQuery,
  usePaymentProviderListQuery,
  useUpdatePaymentMethodMutation
} from '../api'

import {useTranslation} from 'react-i18next'
import {slugify} from '../utility'
import {toggleRequiredLabel} from '../toggleRequiredLabel'

export interface PaymentMethodEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(paymentMethod: FullPaymentMethodFragment): void
}

export function PaymentMethodEditPanel({id, onClose, onSave}: PaymentMethodEditPanelProps) {
  const {t} = useTranslation()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState<boolean>(true)
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
      setSlug(data.paymentMethod.slug)
      setDescription(data.paymentMethod.description)
      setActive(data.paymentMethod.active)
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
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [loadError, createError, updateError, loadPaymentProviderError])

  async function handleSave() {
    if (!paymentProvider) {
      return // TODO: handle validation
    }

    if (id) {
      const {data} = await updatePaymentMethod({
        variables: {
          id,
          input: {
            name,
            slug,
            description,
            active,
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
            slug,
            description,
            active,
            paymentProviderID: paymentProvider.id
          }
        }
      })

      if (data?.createPaymentMethod) onSave?.(data.createPaymentMethod)
    }
  }

  // Schema used for form validation
  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    paymentProvider: StringType().isRequired(t('errorMessages.noPaymentProviderErrorMessage'))
  })

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && handleSave()}
        fluid
        model={validationModel}
        formValue={{name: name, paymentProvider: paymentProvider}}>
        <Drawer.Header>
          <Drawer.Title>
            {id ? t('paymentMethodList.editTitle') : t('paymentMethodList.createTitle')}
          </Drawer.Title>

          <Drawer.Actions>
            <Button
              appearance="primary"
              disabled={isDisabled}
              type="submit"
              onClick={() => handleSave()}>
              {id ? t('save') : t('create')}
            </Button>
            <Button appearance={'subtle'} onClick={() => onClose?.()}>
              {t('close')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>

        <Drawer.Body>
          <Panel>
            <Form.Group>
              <Form.ControlLabel>
                {toggleRequiredLabel(t('paymentMethodList.name'))}
              </Form.ControlLabel>
              <Form.Control
                name="name"
                value={name}
                disabled={isDisabled}
                onChange={(value: string) => {
                  setName(value)
                  setSlug(slugify(value))
                }}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('paymentMethodList.slug')}</Form.ControlLabel>
              <Form.Control name={t('paymentMethodList.slug')} value={slug} plaintext />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('paymentMethodList.active')}</Form.ControlLabel>
              <Toggle checked={active} disabled={isDisabled} onChange={value => setActive(value)} />
              <Form.HelpText>{t('paymentMethodList.activeDescription')}</Form.HelpText>
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>
                {toggleRequiredLabel(t('paymentMethodList.adapter'))}
              </Form.ControlLabel>
              <Form.Control
                name="paymentProvider"
                virtualized
                value={paymentProvider?.id}
                data={paymentProviders.map(pp => ({value: pp.id, label: pp.name}))}
                searchable={false}
                block
                accepter={SelectPicker}
                onChange={(value: any) =>
                  setPaymentProvider(paymentProviders.find(pp => pp.id === value))
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('paymentMethodList.description')}</Form.ControlLabel>
              <Form.Control
                name="description"
                value={description}
                disabled={isDisabled}
                onChange={(value: string) => {
                  setDescription(value)
                }}
              />
            </Form.Group>
          </Panel>
        </Drawer.Body>
      </Form>
    </>
  )
}
