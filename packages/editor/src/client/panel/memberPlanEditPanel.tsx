import React, {useState, useEffect} from 'react'

import {ListValue, ListInput} from '../atoms/listInput'

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
  CheckPicker,
  TagPicker
} from 'rsuite'

import {ImagedEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

import {
  AvailablePaymentMethod,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  ImageRefFragment,
  Maybe,
  MemberPlanListDocument,
  PaymentMethod,
  useCreateMemberPlanMutation,
  useMemberPlanQuery,
  usePaymentMethodListQuery,
  useUpdateMemberPlanMutation
} from '../api'

import {
  generateID,
  getOperationNameFromDocument,
  slugify,
  ALL_PAYMENT_PERIODICITIES
} from '../utility'
import {RichTextBlock, createDefaultValue} from '../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'

import {useTranslation} from 'react-i18next'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {CurrencyInput} from '../atoms/currencyInput'

export interface MemberPlanEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(author: FullMemberPlanFragment): void
}

export function MemberPlanEditPanel({id, onClose, onSave}: MemberPlanEditPanelProps) {
  const {t} = useTranslation()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [image, setImage] = useState<Maybe<ImageRefFragment>>()
  const [description, setDescription] = useState<RichTextBlockValue>(createDefaultValue())
  const [active, setActive] = useState<boolean>(true)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<
    ListValue<AvailablePaymentMethod>[]
  >([])
  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])

  const [amountPerMonthMin, setAmountPerMonthMin] = useState<number>(500)

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {data, loading: isLoading, error: loadError} = useMemberPlanQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const {
    data: paymentMethodData,
    loading: isLoadingPaymentMethods,
    error: paymentMethodLoadError
  } = usePaymentMethodListQuery({
    fetchPolicy: 'network-only'
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

  const isDisabled =
    isLoading ||
    isLoadingPaymentMethods ||
    isCreating ||
    isUpdating ||
    loadError !== undefined ||
    paymentMethodLoadError !== undefined

  useEffect(() => {
    if (data?.memberPlan) {
      setName(data.memberPlan.name)
      setSlug(data.memberPlan.slug)
      setTags(data.memberPlan.tags)
      setImage(data.memberPlan.image)
      setDescription(
        data.memberPlan.description ? data.memberPlan.description : createDefaultValue()
      )
      setActive(data.memberPlan.active)
      setAvailablePaymentMethods(
        data.memberPlan.availablePaymentMethods
          ? data.memberPlan.availablePaymentMethods.map(availablePaymentMethod => ({
              id: generateID(),
              value: availablePaymentMethod
            }))
          : []
      )
      setAmountPerMonthMin(data.memberPlan.amountPerMonthMin)
    }
  }, [data?.memberPlan])

  useEffect(() => {
    if (paymentMethodData?.paymentMethods) {
      setPaymentMethods(paymentMethodData.paymentMethods)
    }
  }, [paymentMethodData?.paymentMethods])

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      paymentMethodLoadError?.message
    if (error) Alert.error(error, 0)
  }, [loadError, createError, updateError, paymentMethodLoadError])

  function handleImageChange(image: ImageRefFragment) {
    setImage(image)
  }

  async function handleSave() {
    if (id) {
      const {data} = await updateMemberPlan({
        variables: {
          id,
          input: {
            name,
            slug,
            tags,
            imageID: image?.id,
            description,
            active,
            availablePaymentMethods: availablePaymentMethods.map(({value}) => ({
              paymentPeriodicities: value.paymentPeriodicities,
              forceAutoRenewal: value.forceAutoRenewal,
              paymentMethodIDs: value.paymentMethods.map(pm => pm.id)
            })),
            amountPerMonthMin
          }
        }
      })

      if (data?.updateMemberPlan) onSave?.(data.updateMemberPlan)
    } else {
      const {data} = await createMemberPlan({
        variables: {
          input: {
            name,
            slug,
            tags,
            imageID: image?.id,
            description,
            active,
            availablePaymentMethods: availablePaymentMethods.map(({value}) => ({
              paymentPeriodicities: value.paymentPeriodicities,
              forceAutoRenewal: value.forceAutoRenewal,
              paymentMethodIDs: value.paymentMethods.map(pm => pm.id)
            })),
            amountPerMonthMin
          }
        }
      })

      if (data?.createMemberPlan) onSave?.(data.createMemberPlan)
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('memberPlanList.editTitle') : t('memberPlanList.createTitle')}
        </Drawer.Title>
      </Drawer.Header>
      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('memberPlanList.name')}</ControlLabel>
              <FormControl
                name={t('memberPlanList.name')}
                value={name}
                disabled={isDisabled}
                onChange={value => {
                  setName(value)
                  setSlug(slugify(value))
                }}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('memberPlanList.slug')}</ControlLabel>
              <FormControl name={t('memberPlanList.slug')} value={slug} plaintext={true} />
            </FormGroup>

            <FormGroup>
              <ControlLabel>{t('articleEditor.panels.tags')}</ControlLabel>
              <TagPicker
                block
                value={tags ?? []}
                creatable={true}
                data={tags ? tags.map(tag => ({label: tag, value: tag})) : []}
                onChange={tagsValue => setTags(tagsValue ?? [])}
              />
            </FormGroup>

            <FormGroup>
              <ControlLabel>{t('memberPlanList.active')}</ControlLabel>
              <Toggle checked={active} disabled={isDisabled} onChange={value => setActive(value)} />
              <HelpBlock>{t('memberPlanList.activeDescription')}</HelpBlock>
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('memberPlanList.minimumMonthlyAmount')}</ControlLabel>

              <CurrencyInput
                prefix="CHF"
                value={amountPerMonthMin}
                step={0.05}
                onChange={value => {
                  setAmountPerMonthMin(value)
                }}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('memberPlanList.description')}</ControlLabel>
              <div className="richTextFrame">
                <RichTextBlock value={description} onChange={value => setDescription(value)} />
              </div>
            </FormGroup>
          </Form>
        </Panel>

        <ChooseEditImage
          image={image}
          disabled={isLoading}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => setImage(undefined)}
        />

        <Panel>
          <ListInput
            value={availablePaymentMethods}
            onChange={app => setAvailablePaymentMethods(app)}
            defaultValue={{
              forceAutoRenewal: false,
              paymentPeriodicities: [],
              paymentMethods: []
            }}>
            {({value, onChange}) => (
              <Form fluid={true}>
                <FormGroup>
                  <ControlLabel>{t('memberPlanList.autoRenewal')}</ControlLabel>
                  <Toggle
                    checked={value.forceAutoRenewal}
                    disabled={isDisabled}
                    onChange={forceAutoRenewal => onChange({...value, forceAutoRenewal})}
                  />
                  <HelpBlock>{t('memberPlanList.autoRenewalDescription')}</HelpBlock>
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('memberPlanList.paymentPeriodicities')}</ControlLabel>
                  <CheckPicker
                    value={value.paymentPeriodicities}
                    data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                      value: pp,
                      label: t(`memberPlanList.paymentPeriodicity.${pp}`)
                    }))}
                    onChange={paymentPeriodicities => onChange({...value, paymentPeriodicities})}
                    block
                  />
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('memberPlanList.paymentMethods')}</ControlLabel>
                  <CheckPicker
                    value={value.paymentMethods.map(pm => pm.id)}
                    data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
                    onChange={paymentMethodIDs => {
                      onChange({
                        ...value,
                        paymentMethods: paymentMethodIDs
                          .map(pmID => paymentMethods.find(pm => pm.id === pmID))
                          .filter(pm => pm !== undefined)
                          .map(pm => pm as PaymentMethod)
                      })
                    }}
                    block
                  />
                </FormGroup>
              </Form>
            )}
          </ListInput>
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

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {image && (
        <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
          <ImagedEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  )
}
