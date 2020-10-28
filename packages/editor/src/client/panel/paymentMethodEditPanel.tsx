import React, {useState, useEffect} from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Box,
  Spacing,
  PanelSectionHeader,
  Toast,
  Toggle
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconSaveOutlined} from '@karma.run/icons'

import {RichTextBlock, createDefaultValue} from '../blocks/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'
import 'react-input-range/lib/css/index.css'
import {
  FullPaymentMethodFragment,
  useCreatePaymentMethodMutation,
  usePaymentMethodQuery,
  useUpdatePaymentMethodMutation
} from '../api'

export interface PaymentMethodEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(paymentMethod: FullPaymentMethodFragment): void
}

export function PaymentMethodEditPanel({id, onClose, onSave}: PaymentMethodEditPanelProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState<RichTextBlockValue>(createDefaultValue())
  const [isActive, setIsActive] = useState<boolean>(false)
  const [paymentAdapter, setPaymentAdapter] = useState<string>('')

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

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
    if (loadError) {
      setErrorToastOpen(true)
      setErrorMessage(loadError.message)
    } else if (createError) {
      setErrorToastOpen(true)
      setErrorMessage(createError.message)
    } else if (updateError) {
      setErrorToastOpen(true)
      setErrorMessage(updateError.message)
    }
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
      <Panel>
        <PanelHeader
          title={id ? 'Edit Member Plan' : 'Create Member Plan'}
          leftChildren={
            <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose?.()} />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={id ? 'Save' : 'Create'}
              disabled={isDisabled}
              onClick={handleSave}
            />
          }
        />

        <PanelSection>
          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label="Name"
              value={name}
              disabled={isDisabled}
              onChange={e => {
                setName(e.target.value)
              }}
            />
          </Box>
          <Box marginBottom={Spacing.ExtraSmall}>
            <Toggle
              label="Active"
              description="Makes the plan available"
              checked={isActive}
              disabled={isDisabled}
              onChange={event => setIsActive(event.target.checked)}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title="Description" />
        <PanelSection>
          <RichTextBlock value={description} onChange={value => setDescription(value)} />
        </PanelSection>
        <PanelSectionHeader title="Payment Adapter" />
        <PanelSection>
          <Box marginBottom={Spacing.Small}>
            <TextInput
              label="Name"
              value={paymentAdapter}
              disabled={isDisabled}
              onChange={e => {
                setPaymentAdapter(e.target.value)
              }}
            />
          </Box>
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
