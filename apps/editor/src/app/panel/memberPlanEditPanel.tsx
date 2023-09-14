import styled from '@emotion/styled'
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
} from '@wepublish/editor/api'
import {
  ALL_PAYMENT_PERIODICITIES,
  ChooseEditImage,
  createCheckedPermissionComponent,
  createDefaultValue,
  CurrencyInput,
  generateID,
  getOperationNameFromDocument,
  ImageEditPanel,
  ImageSelectPanel,
  ListInput,
  ListValue,
  PermissionControl,
  RichTextBlock,
  RichTextBlockValue,
  slugify,
  toggleRequiredLabel,
  useAuthorisation
} from '@wepublish/ui/editor'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  Button,
  CheckPicker,
  Drawer,
  Form as RForm,
  Message,
  Panel,
  Schema,
  TagPicker,
  toaster,
  Toggle
} from 'rsuite'

const {ControlLabel, Group, Control, HelpText} = RForm

const Form = styled(RForm)`
  height: 100%;
`

export interface MemberPlanEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(author: FullMemberPlanFragment): void
}

function MemberPlanEditPanel({id, onClose, onSave}: MemberPlanEditPanelProps) {
  const {t} = useTranslation()
  const isAuthorized = useAuthorisation('CAN_CREATE_MEMBER_PLAN')

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

  const {
    data,
    loading: isLoading,
    error: loadError
  } = useMemberPlanQuery({
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

  const [updateMemberPlan, {loading: isUpdating, error: updateError}] =
    useUpdateMemberPlanMutation()

  const isDisabled =
    isLoading ||
    isLoadingPaymentMethods ||
    isCreating ||
    isUpdating ||
    loadError !== undefined ||
    paymentMethodLoadError !== undefined ||
    !isAuthorized

  useEffect(() => {
    if (data?.memberPlan) {
      setName(data.memberPlan.name)
      setSlug(data.memberPlan.slug)
      setTags(data.memberPlan.tags ?? [])
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
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
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

  // Schema used for form validation
  const {StringType, NumberType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    currency: NumberType().isRequired(t('errorMessages.noAmountErrorMessage'))
  })

  return (
    <Form
      onSubmit={validationPassed => validationPassed && handleSave()}
      fluid
      model={validationModel}
      formValue={{name, currency: amountPerMonthMin}}>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('memberPlanList.editTitle') : t('memberPlanList.createTitle')}
        </Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_MEMBER_PLAN']}>
            <Button appearance="primary" disabled={isDisabled} type="submit">
              {id ? t('save') : t('create')}
            </Button>
          </PermissionControl>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>
      <Drawer.Body>
        <Panel>
          <Group controlId="memberPlanName">
            <ControlLabel>{toggleRequiredLabel(t('memberPlanList.name'))}</ControlLabel>
            <Control
              name="name"
              value={name}
              disabled={isDisabled}
              onChange={(value: string) => {
                setName(value)
                setSlug(slugify(value))
              }}
            />
          </Group>
          <Group controlId="memberPlanSlug">
            <ControlLabel>{t('memberPlanList.slug')}</ControlLabel>
            <Control name={t('memberPlanList.slug')} value={slug} plaintext />
          </Group>

          <Group controlId="memberPlanTags">
            <ControlLabel>{t('articleEditor.panels.tags')}</ControlLabel>
            <TagPicker
              disabled={isDisabled}
              block
              virtualized
              value={tags ?? []}
              creatable
              data={tags ? tags.map(tag => ({label: tag, value: tag})) : []}
              onChange={tagsValue => setTags(tagsValue ?? [])}
            />
          </Group>

          <Group controlId="memberPlanActive">
            <ControlLabel>{t('memberPlanList.active')}</ControlLabel>
            <Toggle checked={active} disabled={isDisabled} onChange={value => setActive(value)} />
            <HelpText>{t('memberPlanList.activeDescription')}</HelpText>
          </Group>

          <Group controlId="memberPlanMinimumMonthlyAmount">
            <ControlLabel>
              {toggleRequiredLabel(t('memberPlanList.minimumMonthlyAmount'))}
            </ControlLabel>
            <CurrencyInput
              name="currency"
              currency="CHF"
              centAmount={amountPerMonthMin}
              disabled={isDisabled}
              onChange={centAmount => {
                setAmountPerMonthMin(centAmount)
              }}
            />
          </Group>
          <Group controlId="memberPlanDescription">
            <ControlLabel>{t('memberPlanList.description')}</ControlLabel>
            <div className="richTextFrame">
              <RichTextBlock
                value={description}
                disabled={isDisabled}
                onChange={value => setDescription(value)}
              />
            </div>
          </Group>
        </Panel>

        <ChooseEditImage
          image={image}
          disabled={isLoading}
          openChooseModalOpen={() => setChooseModalOpen(true)}
          openEditModalOpen={() => setEditModalOpen(true)}
          removeImage={() => setImage(undefined)}
        />

        <Panel header={t('settingList.payment')}>
          <ListInput
            value={availablePaymentMethods}
            disabled={isDisabled}
            onChange={app => setAvailablePaymentMethods(app)}
            defaultValue={{
              forceAutoRenewal: false,
              paymentPeriodicities: [],
              paymentMethods: []
            }}>
            {({value, onChange}) => (
              <Form fluid>
                <Group controlId="memberPlanAutoRenewal">
                  <ControlLabel>{t('memberPlanList.autoRenewal')}</ControlLabel>
                  <Toggle
                    checked={value.forceAutoRenewal}
                    disabled={isDisabled}
                    onChange={forceAutoRenewal => onChange({...value, forceAutoRenewal})}
                  />
                  <HelpText>{t('memberPlanList.autoRenewalDescription')}</HelpText>
                </Group>
                <Group controlId="memberPlanPaymentPeriodicity">
                  <ControlLabel>{t('memberPlanList.paymentPeriodicities')}</ControlLabel>
                  <CheckPicker
                    virtualized
                    value={value.paymentPeriodicities}
                    data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                      value: pp,
                      label: t(`memberPlanList.paymentPeriodicity.${pp}`)
                    }))}
                    onChange={paymentPeriodicities => onChange({...value, paymentPeriodicities})}
                    block
                    placement="auto"
                  />
                </Group>
                <Group controlId="memberPlanPaymentMethod">
                  <ControlLabel>{t('memberPlanList.paymentMethods')}</ControlLabel>
                  <CheckPicker
                    virtualized
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
                    placement="auto"
                  />
                </Group>
              </Form>
            )}
          </ListInput>
        </Panel>
      </Drawer.Body>

      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: ImageRefFragment) => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>
      {image && (
        <Drawer open={isEditModalOpen} size="sm" onClose={() => setEditModalOpen(false)}>
          <ImageEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </Form>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MEMBER_PLANS',
  'CAN_GET_MEMBER_PLAN',
  'CAN_CREATE_MEMBER_PLAN',
  'CAN_DELETE_MEMBER_PLAN'
])(MemberPlanEditPanel)
export {CheckedPermissionComponent as MemberPlanEditPanel}
