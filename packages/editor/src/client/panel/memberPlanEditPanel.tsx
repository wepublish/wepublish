import React, {useState, useEffect} from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Box,
  Spacing,
  PlaceholderInput,
  PanelSectionHeader,
  Card,
  Drawer,
  IconButton,
  Image,
  Toast,
  ZIndex,
  Toggle,
  Typography
} from '@karma.run/ui'

import {
  MaterialIconClose,
  MaterialIconImageOutlined,
  MaterialIconEditOutlined,
  MaterialIconSaveOutlined
} from '@karma.run/icons'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

import {
  FullMemberPlanFragment,
  ImageRefFragment,
  Maybe,
  MemberPlanListDocument,
  useCreateMemberPlanMutation,
  useMemberPlanQuery,
  useUpdateMemberPlanMutation
} from '../api'

import {getOperationNameFromDocument} from '../utility'
import {RichTextBlock, createDefaultValue} from '../blocks/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'
import InputRange from 'react-input-range'
import 'react-input-range/lib/css/index.css'

export interface MemberPlanEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(author: FullMemberPlanFragment): void
}

export function MemberPlanEditPanel({id, onClose, onSave}: MemberPlanEditPanelProps) {
  const [label, setLabel] = useState('')
  const [image, setImage] = useState<Maybe<ImageRefFragment>>()
  const [description, setDescription] = useState<RichTextBlockValue>(createDefaultValue())
  const [isActive, setIsActive] = useState<boolean>(false)
  const [availablePaymentPeriodicity, setAvailablePaymentPeriodicity] = useState<
    {id: string; checked: boolean}[]
  >([])
  const [minimumDuration, setMinimumDuration] = useState<number>(0)
  const [forceAutoRenewal, setForceAutoRenewal] = useState<boolean>(false)
  const [fixPrice, setFixPrice] = useState<boolean>(false)
  const [pricePerMonthMinimum, setPricePerMonthMinimum] = useState<number>(0)
  const [pricePerMonthMaximum, setPricePerMonthMaximum] = useState<number>(0)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {data, loading: isLoading, error: loadError} = useMemberPlanQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id == undefined
  })

  const [createMemberPlan, {loading: isCreating, error: createError}] = useCreateMemberPlanMutation(
    {
      refetchQueries: [getOperationNameFromDocument(MemberPlanListDocument)]
    }
  )

  const [
    updateMemberPlan,
    {loading: isUpdating, error: updateError}
  ] = useUpdateMemberPlanMutation()

  const isDisabled = isLoading || isCreating || isUpdating || loadError != undefined

  useEffect(() => {
    if (data?.memberPlan) {
      setLabel(data.memberPlan.label)
      setImage(data.memberPlan.image)
      setDescription(
        data.memberPlan.description ? data.memberPlan.description : createDefaultValue()
      )
      setIsActive(data.memberPlan.isActive)
      setAvailablePaymentPeriodicity(data.memberPlan.availablePaymentPeriodicity)
      setMinimumDuration(data.memberPlan.minimumDuration)
      setForceAutoRenewal(data.memberPlan.forceAutoRenewal)
      setPricePerMonthMinimum(data.memberPlan.pricePerMonthMinimum)
      setPricePerMonthMaximum(data.memberPlan.pricePerMonthMaximum)
    }
  }, [data?.memberPlan])

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

  function handleImageChange(image: ImageRefFragment) {
    setImage(image)
  }

  async function handleSave() {
    if (id) {
      const {data} = await updateMemberPlan({
        variables: {
          id,
          input: {
            label,
            image: image?.id,
            description,
            isActive,
            availablePaymentPeriodicity: availablePaymentPeriodicity
              .filter(({checked}) => checked)
              .map(({id}) => id),
            minimumDuration,
            forceAutoRenewal,
            pricePerMonthMinimum,
            pricePerMonthMaximum: fixPrice ? pricePerMonthMinimum : pricePerMonthMaximum
          }
        }
      })

      if (data?.updateMemberPlan) onSave?.(data.updateMemberPlan)
    } else {
      const {data} = await createMemberPlan({
        variables: {
          input: {
            label,
            image: image?.id,
            description,
            isActive,
            availablePaymentPeriodicity: availablePaymentPeriodicity
              .filter(({checked}) => checked)
              .map(({id}) => id),
            minimumDuration,
            forceAutoRenewal,
            pricePerMonthMinimum,
            pricePerMonthMaximum: fixPrice ? pricePerMonthMinimum : pricePerMonthMaximum
          }
        }
      })

      if (data?.createMemberPlan) onSave?.(data.createMemberPlan)
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
              label="Label"
              value={label}
              disabled={isDisabled}
              onChange={e => {
                setLabel(e.target.value)
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
        <PanelSectionHeader title="Image" />
        <PanelSection dark>
          <Box height={200}>
            <Card>
              <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
                {image && (
                  <Box position="relative" width="100%" height="100%">
                    <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                      <IconButton
                        icon={MaterialIconImageOutlined}
                        title="Choose Image"
                        margin={Spacing.ExtraSmall}
                        onClick={() => setChooseModalOpen(true)}
                      />
                      <IconButton
                        icon={MaterialIconEditOutlined}
                        title="Edit Image"
                        margin={Spacing.ExtraSmall}
                        onClick={() => setEditModalOpen(true)}
                      />
                      <IconButton
                        icon={MaterialIconClose}
                        title="Remove Image"
                        margin={Spacing.ExtraSmall}
                        onClick={() => setImage(undefined)}
                      />
                    </Box>
                    {image.previewURL && <Image src={image.previewURL} width="100%" height={200} />}
                  </Box>
                )}
              </PlaceholderInput>
            </Card>
          </Box>
        </PanelSection>
        <PanelSectionHeader title="Description" />
        <PanelSection>
          <RichTextBlock value={description} onChange={value => setDescription(value)} />
        </PanelSection>
        <PanelSectionHeader title="Settings" />
        <PanelSection>
          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              type="number"
              label="Minimum duration"
              value={minimumDuration}
              disabled={isDisabled}
              onChange={e => {
                setMinimumDuration(parseInt(e.target.value))
              }}
            />
          </Box>
          <Box marginBottom={Spacing.Small}>
            <Toggle
              label="Fix price"
              description="If false the price can be a price range"
              checked={fixPrice}
              disabled={isDisabled}
              onChange={event => setFixPrice(event.target.checked)}
            />
          </Box>
          <Box marginBottom={Spacing.Small}>
            <Typography variant="subtitle1">Price-(Range) in CHF</Typography>
          </Box>
          <Box
            marginBottom={Spacing.Medium}
            marginLeft={Spacing.ExtraSmall}
            marginRight={Spacing.ExtraSmall}>
            <InputRange
              onChange={value => {
                if (fixPrice) {
                  setPricePerMonthMinimum(value as number)
                } else {
                  //TODO: fix this
                  //@ts-ignore
                  setPricePerMonthMinimum(value.min)
                  //@ts-ignore
                  setPricePerMonthMaximum(value.max)
                }
              }}
              value={
                fixPrice
                  ? pricePerMonthMinimum
                  : {min: pricePerMonthMinimum, max: pricePerMonthMaximum}
              }
              minValue={0}
              maxValue={100}
            />
          </Box>
          <Box marginBottom={Spacing.ExtraSmall}>
            <Toggle
              label="Force Auto Renewal"
              description="Forces auto renewal of subscription"
              checked={forceAutoRenewal}
              disabled={isDisabled}
              onChange={event => setForceAutoRenewal(event.target.checked)}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title="Payment Pariodicity" />
        <PanelSection>
          {availablePaymentPeriodicity.map((paymentPeriodicity, index) => {
            return (
              <Box marginBottom={Spacing.ExtraSmall}>
                <Toggle
                  key={index}
                  name={paymentPeriodicity.id}
                  label={paymentPeriodicity.id}
                  disabled={isDisabled}
                  checked={paymentPeriodicity.checked}
                  onChange={event => {
                    const newAPP = availablePaymentPeriodicity.map(app => {
                      return app.id === event.target.name
                        ? {...app, checked: event.target.checked}
                        : app
                    })
                    setAvailablePaymentPeriodicity(newAPP)
                  }}
                />
              </Box>
            )
          })}
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={value => {
              setChooseModalOpen(false)
              handleImageChange(value)
            }}
          />
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <ImagedEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        )}
      </Drawer>
    </>
  )
}
