import React, {useState, useEffect, useRef} from 'react'

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
  SelectPicker,
  Schema
} from 'rsuite'

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
import {FormInstance} from 'rsuite/lib/Form'

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
    if (error) Alert.error(error, 0)
  }, [loadError, createError, updateError, loadPaymentProviderError])

  const form = useRef<FormInstance>(null)

  async function handleSave() {
    if (!form.current?.check()) {
      return
    }

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
    name: StringType().isRequired('Please enter a name'),
    // how to get that inside the picker ?
    paymentProvider: StringType().isRequired('Please select a payment adapter')
  })

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('paymentMethodList.editTitle') : t('paymentMethodList.createTitle')}
        </Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form ref={form} fluid={true} model={validationModel}>
            <FormGroup>
              <ControlLabel>{t('paymentMethodList.name') + '*'}</ControlLabel>
              <FormControl
                name="name"
                value={name}
                disabled={isDisabled}
                onChange={value => {
                  setName(value)
                  setSlug(slugify(value))
                }}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('paymentMethodList.slug')}</ControlLabel>
              <FormControl name={t('paymentMethodList.slug')} value={slug} plaintext={true} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('paymentMethodList.active')}</ControlLabel>
              <Toggle checked={active} disabled={isDisabled} onChange={value => setActive(value)} />
              <HelpBlock>{t('paymentMethodList.activeDescription')}</HelpBlock>
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('paymentMethodList.adapter')}</ControlLabel>
              <SelectPicker
                name="paymentProvider"
                value={paymentProvider?.id}
                data={paymentProviders.map(pp => ({value: pp.id, label: pp.name}))}
                searchable={false}
                block={true}
                onChange={value => setPaymentProvider(paymentProviders.find(pp => pp.id === value))}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('paymentMethodList.description')}</ControlLabel>
              <FormControl
                name="description"
                value={description}
                disabled={isDisabled}
                onChange={value => {
                  setDescription(value)
                }}
              />
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
