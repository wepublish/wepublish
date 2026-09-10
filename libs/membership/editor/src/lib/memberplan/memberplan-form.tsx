import React, { Dispatch, SetStateAction, useMemo, useState } from 'react';
import {
  Currency,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullImageFragment,
  PaymentMethod,
  PaymentPeriodicity,
  ProductType,
  FullAvailablePaymentMethodFragment,
} from '@wepublish/editor/api';
import {
  Button,
  CheckPicker,
  Col,
  Divider,
  Drawer,
  Form as RForm,
  Form,
  Input,
  Message,
  Panel,
  Row,
  SelectPicker,
  TagPicker,
  toaster,
  Toggle,
} from 'rsuite';
import { useTranslation } from 'react-i18next';
import { slugify } from '@wepublish/utils';
import {
  ALL_PAYMENT_PERIODICITIES,
  ChooseEditImage,
  ImageEditPanel,
  ImageSelectPanel,
  ListInput,
  ListValue,
  RichTextBlock,
  RichTextBlockValue,
  SelectPage,
} from '@wepublish/ui/editor';
import { MdAutoFixHigh, MdCheck } from 'react-icons/md';
import { MemberPlanPricing } from './memberplan-pricing';
import { Alert } from '@mui/material';
import styled from '@emotion/styled';

const { Label, Text, Control } = RForm;

const ColTextAlignEnd = styled(Col)`
  text-align: end;
`;

const FormLabelMarginRight = styled(Label)`
  margin-right: 10px;
`;
const FormLabelMarginLeft = styled(Label)`
  margin-left: 10px;
`;

const PanelWidth100 = styled(Panel)`
  width: 100%;
`;

const RowPaddingTop = styled(Row)`
  padding-top: 12px;
`;

const DividerTextAlignLeft = styled(Divider)`
  &&& {
    margin-left: -5px;
    margin-right: -5px;
  }

  &&&::before {
    content: none;
  }

  &&& > .rs-divider-inner-text {
    padding-left: 0;
  }
`;

interface MemberPlanFormProps {
  memberPlanId?: string;
  memberPlan?: FullMemberPlanFragment | null;
  availablePaymentMethods: ListValue<FullAvailablePaymentMethodFragment>[];
  paymentMethods: FullPaymentMethodFragment[];
  loading: boolean;
  setMemberPlan: Dispatch<
    SetStateAction<FullMemberPlanFragment | null | undefined>
  >;
  setAvailablePaymentMethods: Dispatch<
    SetStateAction<ListValue<FullAvailablePaymentMethodFragment>[]>
  >;
}

export function MemberPlanForm({
  memberPlanId,
  memberPlan,
  availablePaymentMethods,
  paymentMethods,
  loading,
  setMemberPlan,
  setAvailablePaymentMethods,
}: MemberPlanFormProps) {
  const { t } = useTranslation();
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const productType = memberPlan?.productType ?? ProductType.Subscription;
  const isDonationProduct = productType === ProductType.Donation;
  const maxCountLabel = t(
    isDonationProduct ?
      'memberplanForm.maxCountDonation'
    : 'memberplanForm.maxCount'
  );
  const maxCountHelpText = t(
    isDonationProduct ?
      'memberplanForm.maxCountDonationHelpText'
    : 'memberplanForm.maxCountHelpText'
  );

  const isTrialSubscription = useMemo(
    () => !memberPlan?.extendable && !!memberPlan?.maxCount,
    [memberPlan]
  );

  const enabledPeriodicities = useMemo(() => {
    const enabled = new Set(
      availablePaymentMethods.flatMap(({ value }) => value.paymentPeriodicities)
    );

    return ALL_PAYMENT_PERIODICITIES.filter(periodicity =>
      enabled.has(periodicity)
    );
  }, [availablePaymentMethods]);

  function setExtendable(
    extendable: boolean,
    updatedMemberPlan: FullMemberPlanFragment | undefined | null = memberPlan
  ): void {
    // a subscription plan must be extendable if at least one payment methods requires auto renew
    const forcedAutoRenewPaymentMethods = !!availablePaymentMethods?.find(
      apm => apm.value.forceAutoRenewal
    );

    if (forcedAutoRenewPaymentMethods) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {t('memberplanForm.trialSubscriptionNotPossible')}
        </Message>,
        { duration: 6000 }
      );

      return;
    }

    if (!updatedMemberPlan) {
      return;
    }

    // update extendable prop of the member plan
    setMemberPlan({
      ...updatedMemberPlan,
      extendable,
    });
  }

  function setForceAutoRenewal(
    forceAutoRenewal: boolean,
    onChange: React.Dispatch<
      React.SetStateAction<FullAvailablePaymentMethodFragment>
    >,
    availablePaymentMethod: FullAvailablePaymentMethodFragment
  ): void {
    // if subscription plan ist not extendable, a subscription can not be forced to be auto-renew.
    if (!memberPlan?.extendable && forceAutoRenewal) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {t('memberplanForm.forceAutoRenewNotPossible')}
        </Message>
      );

      return;
    }

    onChange({ ...availablePaymentMethod, forceAutoRenewal });
  }

  function updateName(name: string | undefined) {
    setMemberPlan(memberPlan => {
      if (!memberPlan) {
        return;
      }

      name = name || '';
      let slug = memberPlan.slug;

      // only update slug, if we create a new member plan
      if (!memberPlanId) {
        slug = slugify(name);
      }

      return { ...memberPlan, name, slug };
    });
  }

  return (
    <Row>
      <Col xs={12}>
        <PanelWidth100 bordered>
          <Row>
            {/* product type */}
            <Col xs={24}>
              <Form.Label>{t('memberplanForm.productType')}</Form.Label>
              <SelectPicker
                cleanable={false}
                searchable={false}
                block
                value={memberPlan?.productType ?? ProductType.Subscription}
                data={[
                  {
                    value: ProductType.Subscription,
                    label: t('memberplanForm.productTypeSubscription'),
                  },
                  {
                    value: ProductType.Donation,
                    label: t('memberplanForm.productTypeDonation'),
                  },
                ]}
                disabled={loading}
                onChange={(productType: ProductType | null) => {
                  if (!memberPlan) {
                    return;
                  }

                  setMemberPlan({
                    ...memberPlan,
                    productType: productType ?? ProductType.Subscription,
                  });
                }}
              />
              <Text>{t('memberplanForm.productTypeHelpText')}</Text>
            </Col>

            {/* image */}
            <Col xs={12}>
              <ChooseEditImage
                image={memberPlan?.image}
                disabled={loading}
                openChooseModalOpen={() => setChooseModalOpen(true)}
                openEditModalOpen={() => setEditModalOpen(true)}
                removeImage={() => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({ ...memberPlan, image: undefined });
                }}
              />
            </Col>

            {/* active / inactive */}
            <ColTextAlignEnd xs={12}>
              <FormLabelMarginRight>
                {t('memberPlanEdit.active')}
              </FormLabelMarginRight>
              <Toggle
                checked={!!memberPlan?.active}
                disabled={loading}
                onChange={active => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({ ...memberPlan, active });
                }}
              />
              <Text>{t('memberPlanEdit.activeDescription')}</Text>
            </ColTextAlignEnd>

            <Col xs={24}>
              <Row>
                {/* name */}
                <Col xs={12}>
                  <Form.Label>{t('memberPlanEdit.name')}</Form.Label>
                  <Form.Control
                    name="name"
                    value={memberPlan?.name || ''}
                    onChange={(newName: string | undefined) =>
                      updateName(newName)
                    }
                  />
                </Col>

                {/* slug */}
                <Col xs={12}>
                  <Form.Label>{t('memberPlanEdit.slug')}</Form.Label>
                  <Form.Control
                    name="slug"
                    value={memberPlan?.slug || ''}
                    onChange={(newSlug: string | undefined) => {
                      if (!memberPlan) {
                        return;
                      }
                      setMemberPlan({
                        ...memberPlan,
                        slug: slugify(newSlug || ''),
                      });
                    }}
                  />
                </Col>
              </Row>
            </Col>

            {/* description */}
            <Col xs={24}>
              <Form.Label>{t('memberPlanEdit.description')}</Form.Label>

              <RichTextBlock
                value={memberPlan?.description}
                disabled={loading}
                onChange={newDescription => {
                  if (memberPlan) {
                    setMemberPlan({
                      ...memberPlan,
                      description:
                        newDescription as RichTextBlockValue['richText'],
                    });
                  }
                }}
              />
            </Col>

            {/* short description */}
            <Col xs={24}>
              <Form.Label>{t('memberPlanEdit.shortDescription')}</Form.Label>

              <RichTextBlock
                value={memberPlan?.shortDescription}
                disabled={loading}
                onChange={newShortDescription => {
                  if (memberPlan) {
                    setMemberPlan({
                      ...memberPlan,
                      shortDescription:
                        newShortDescription as RichTextBlockValue['richText'],
                    });
                  }
                }}
              />
            </Col>

            <Col xs={24}>
              <Form.Label>{t('memberPlanEdit.externalReward')}</Form.Label>

              <Form.Control
                name="externalReward"
                value={memberPlan?.externalReward || ''}
                onChange={(newexternalReward: string | undefined) => {
                  if (!memberPlan) {
                    return;
                  }

                  setMemberPlan({
                    ...memberPlan,
                    externalReward: newexternalReward,
                  });
                }}
              />
            </Col>
          </Row>
        </PanelWidth100>
      </Col>

      <Col xs={12}>
        <Panel
          header={t('memberplanForm.trialSubscription')}
          bordered
        >
          {/* tags */}
          <Row>
            <Col xs={24}>
              <Form.Label>{t('memberPlanEdit.tags')}</Form.Label>
              <TagPicker
                disabled={loading}
                block
                virtualized
                value={memberPlan?.tags ?? []}
                creatable
                data={
                  memberPlan?.tags ?
                    memberPlan.tags.map(tag => ({ label: tag, value: tag }))
                  : []
                }
                onChange={tagsValue => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({ ...memberPlan, tags: tagsValue });
                }}
              />
            </Col>
          </Row>

          {/* automatically configure trial subscription */}
          <RowPaddingTop>
            <Col xs={24}>
              {isTrialSubscription ?
                <Alert
                  icon={<MdCheck />}
                  severity="success"
                >
                  {t('memberplanForm.trialMemberplanAlert')}
                </Alert>
              : <Button
                  startIcon={<MdAutoFixHigh />}
                  onClick={() =>
                    setExtendable(
                      false,
                      memberPlan ? { ...memberPlan, maxCount: 1 } : undefined
                    )
                  }
                  disabled={isTrialSubscription}
                  color={'green'}
                >
                  {t('memberplanForm.configureTrialBtn')}
                </Button>
              }
            </Col>
          </RowPaddingTop>
          <RowPaddingTop>
            {/* extendable */}
            <Col xs={12}>
              <Toggle
                checked={memberPlan?.extendable}
                onChange={extendable => setExtendable(extendable)}
              />
              <FormLabelMarginLeft>
                {t('memberplanForm.extendableToggle')}
              </FormLabelMarginLeft>
              <Text>{t('memberplanForm.extendableHelpText')}</Text>
            </Col>
            {/* max count */}
            <Col xs={12}>
              <Label>{maxCountLabel}</Label>
              <Input
                placeholder={maxCountLabel}
                type={'number'}
                min={0}
                value={memberPlan?.maxCount || undefined}
                onChange={maxCount => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({
                    ...memberPlan,
                    maxCount: Number(maxCount) || null,
                  });
                }}
              />
              <Text>{maxCountHelpText}</Text>
            </Col>
          </RowPaddingTop>
          <RowPaddingTop>
            <Col xs={12}>
              <Label>{t('memberplanForm.migratePMTitle')}</Label>
              <Control
                name="migrateToTargetPaymentMethodID"
                block
                virtualized
                disabled={loading}
                data={paymentMethods.map(pm => ({
                  value: pm.id,
                  label: pm.name,
                }))}
                value={memberPlan?.migrateToTargetPaymentMethodID}
                accepter={SelectPicker}
                placement="auto"
                onChange={migrateToTargetPaymentMethodID =>
                  setMemberPlan({
                    ...(memberPlan as FullMemberPlanFragment),
                    migrateToTargetPaymentMethodID:
                      migrateToTargetPaymentMethodID || null,
                  })
                }
              />
              <Text>{t('memberplanForm.migratePMHelptext')}</Text>
            </Col>
          </RowPaddingTop>

          {/* redirections */}
          <DividerTextAlignLeft>
            {t('memberplanForm.redirectionsTitle')}
          </DividerTextAlignLeft>
          <Row>
            <Form.Label>{t('memberPlanEdit.successPage')}</Form.Label>
            <SelectPage
              setSelectedPage={successPageId => {
                if (!memberPlan) {
                  return;
                }

                setMemberPlan({ ...memberPlan, successPageId });
              }}
              selectedPage={memberPlan?.successPageId}
              name="successPageId"
            />
          </Row>

          <RowPaddingTop>
            <Form.Label>{t('memberPlanEdit.failPage')}</Form.Label>
            <SelectPage
              setSelectedPage={failPageId => {
                if (!memberPlan) {
                  return;
                }

                setMemberPlan({ ...memberPlan, failPageId });
              }}
              selectedPage={memberPlan?.failPageId}
              name="failPageId"
            />
          </RowPaddingTop>

          <RowPaddingTop>
            <Form.Label>{t('memberplanForm.confirmationPage')}</Form.Label>
            <SelectPage
              setSelectedPage={confirmationPageId => {
                if (!memberPlan) {
                  return;
                }

                setMemberPlan({ ...memberPlan, confirmationPageId });
              }}
              selectedPage={memberPlan?.confirmationPageId}
              name="failPageId"
            />
          </RowPaddingTop>
          <Text>{t('memberplanForm.confirmationPageHelptext')}</Text>
        </Panel>
      </Col>

      {/* payment method settings */}
      <Col xs={24}>
        <PanelWidth100
          header={t('memberPlanEdit.paymentConfigs')}
          bordered
        >
          <Row>
            {/* currency */}
            <Col xs={12}>
              <Form.Label>{t('memberPlanEdit.currency')}</Form.Label>
              <SelectPicker
                name="currency"
                cleanable={false}
                block
                value={memberPlan?.currency ?? null}
                data={[
                  { value: Currency.Chf, label: Currency.Chf },
                  { value: Currency.Eur, label: Currency.Eur },
                ]}
                disabled={loading}
                onChange={(currency: Currency | null) => {
                  if (!memberPlan || !currency) {
                    return;
                  }

                  setMemberPlan({ ...memberPlan, currency });
                }}
              />

              {/* default payment periodicity */}
              <RowPaddingTop>
                <Col xs={24}>
                  <Form.Label>
                    {t('memberplanForm.defaultPaymentPeriodicity')}
                  </Form.Label>
                  <SelectPicker
                    cleanable
                    searchable={false}
                    block
                    placement="auto"
                    value={memberPlan?.defaultPaymentPeriodicity ?? null}
                    data={enabledPeriodicities.map(periodicity => ({
                      value: periodicity,
                      label: t(
                        `memberPlanList.paymentPeriodicity.${periodicity}`
                      ),
                    }))}
                    disabled={loading}
                    onChange={(
                      defaultPaymentPeriodicity: PaymentPeriodicity | null
                    ) => {
                      if (!memberPlan) {
                        return;
                      }

                      setMemberPlan({
                        ...memberPlan,
                        defaultPaymentPeriodicity,
                      });
                    }}
                  />
                  <Text>
                    {t('memberplanForm.defaultPaymentPeriodicityHelpText')}
                  </Text>
                </Col>
              </RowPaddingTop>
            </Col>

            <Col xs={12}>
              <ListInput
                value={availablePaymentMethods}
                disabled={loading}
                onChange={app => setAvailablePaymentMethods(app)}
                defaultValue={{
                  forceAutoRenewal: false,
                  paymentPeriodicities: [],
                  paymentMethods: [],
                }}
              >
                {({ value, onChange }) => (
                  <Panel
                    collapsible
                    bordered
                    header={t('memberPlanEdit.editPaymentSetting')}
                    style={{ width: '100%' }}
                  >
                    <Row>
                      {/* force auto-renew */}
                      <Col xs={24}>
                        <FormLabelMarginRight>
                          {t('memberPlanEdit.forceAutoRenewal')}
                        </FormLabelMarginRight>
                        <Toggle
                          checked={value.forceAutoRenewal}
                          disabled={loading}
                          onChange={forceAutoRenewal =>
                            setForceAutoRenewal(
                              forceAutoRenewal,
                              onChange,
                              value
                            )
                          }
                        />
                        <Text>
                          {t('memberPlanEdit.autoRenewalDescription')}
                        </Text>
                      </Col>

                      {/* payment periodicity */}
                      <Col xs={24}>
                        <Form.Label>
                          {t('memberPlanList.paymentPeriodicities')}
                        </Form.Label>
                        <CheckPicker
                          virtualized
                          value={value.paymentPeriodicities}
                          data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                            value: pp,
                            label: t(`memberPlanList.paymentPeriodicity.${pp}`),
                          }))}
                          onChange={paymentPeriodicities =>
                            onChange({ ...value, paymentPeriodicities })
                          }
                          block
                          placement="auto"
                          cleanable
                        />
                      </Col>

                      {/* payment method selection */}
                      <Col xs={24}>
                        <Form.Label>
                          {t('memberPlanList.paymentMethods')}
                        </Form.Label>
                        <CheckPicker
                          virtualized
                          value={value.paymentMethods.map(pm => pm.id)}
                          data={paymentMethods.map(pm => ({
                            value: pm.id,
                            label: pm.name,
                          }))}
                          onChange={paymentMethodIDs => {
                            onChange({
                              ...value,
                              paymentMethods: paymentMethodIDs
                                .map(pmID =>
                                  paymentMethods.find(pm => pm.id === pmID)
                                )
                                .filter(pm => pm !== undefined)
                                .map(pm => pm as PaymentMethod),
                            });
                          }}
                          block
                          placement="auto"
                        />
                      </Col>
                    </Row>
                  </Panel>
                )}
              </ListInput>
            </Col>
          </Row>
        </PanelWidth100>
      </Col>

      {/* pricing */}
      <Col xs={24}>
        <MemberPlanPricing
          memberPlan={memberPlan}
          availablePaymentMethods={availablePaymentMethods}
          loading={loading}
          setMemberPlan={setMemberPlan}
        />
      </Col>

      {/* image upload and selection */}
      <Drawer
        open={isChooseModalOpen}
        size="sm"
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(image: FullImageFragment) => {
            setChooseModalOpen(false);
            if (!memberPlan) {
              return;
            }
            setMemberPlan({ ...memberPlan, image });
          }}
        />
      </Drawer>

      {memberPlan?.image && (
        <Drawer
          open={isEditModalOpen}
          size="sm"
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={memberPlan.image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </Row>
  );
}
