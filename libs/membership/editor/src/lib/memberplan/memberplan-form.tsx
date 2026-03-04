import React, { Dispatch, SetStateAction, useMemo, useState } from 'react';
import {
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullImageFragment,
  PaymentMethod,
  Currency,
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
  CurrencyInput,
  ImageEditPanel,
  ImageSelectPanel,
  ListInput,
  ListValue,
  RichTextBlock,
  RichTextBlockValue,
  SelectPage,
} from '@wepublish/ui/editor';
import { MdAutoFixHigh, MdCheck } from 'react-icons/md';
import { Alert } from '@mui/material';
import styled from '@emotion/styled';

const { ControlLabel, HelpText, Control } = RForm;

const ColTextAlignEnd = styled(Col)`
  text-align: end;
`;

const FormControlLabelMarginRight = styled(ControlLabel)`
  margin-right: 10px;
`;
const FormControlLabelMarginLeft = styled(ControlLabel)`
  margin-left: 10px;
`;

const PanelWidth100 = styled(Panel)`
  width: 100%;
`;

const RowPaddingTop = styled(Row)`
  padding-top: 12px;
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
              <Form.ControlLabel>
                {t('memberplanForm.productType')}
              </Form.ControlLabel>
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
              <HelpText>{t('memberplanForm.productTypeHelpText')}</HelpText>
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
              <FormControlLabelMarginRight>
                {t('memberPlanEdit.active')}
              </FormControlLabelMarginRight>
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
              <Form.HelpText>
                {t('memberPlanEdit.activeDescription')}
              </Form.HelpText>
            </ColTextAlignEnd>

            <Col xs={24}>
              <Row>
                {/* name */}
                <Col xs={12}>
                  <Form.ControlLabel>
                    {t('memberPlanEdit.name')}
                  </Form.ControlLabel>
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
                  <Form.ControlLabel>
                    {t('memberPlanEdit.slug')}
                  </Form.ControlLabel>
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
              <Form.ControlLabel>
                {t('memberPlanEdit.description')}
              </Form.ControlLabel>
              <div className="richTextFrame">
                {memberPlan && (
                  <RichTextBlock
                    value={memberPlan?.description || []}
                    disabled={loading}
                    onChange={newDescription => {
                      if (!memberPlan) {
                        return;
                      }
                      setMemberPlan({
                        ...memberPlan,
                        description:
                          (newDescription as RichTextBlockValue['richText']) ||
                          [],
                      });
                    }}
                  />
                )}
              </div>
            </Col>

            {/* short description */}
            <Col xs={24}>
              <Form.ControlLabel>
                {t('memberPlanEdit.shortDescription')}
              </Form.ControlLabel>
              <div className="richTextFrame">
                {memberPlan && (
                  <RichTextBlock
                    value={memberPlan?.shortDescription || []}
                    disabled={loading}
                    onChange={newShortDescription => {
                      if (!memberPlan) {
                        return;
                      }
                      setMemberPlan({
                        ...memberPlan,
                        shortDescription:
                          (newShortDescription as RichTextBlockValue['richText']) ||
                          [],
                      });
                    }}
                  />
                )}
              </div>
            </Col>

            <Col xs={24}>
              <Form.ControlLabel>
                {t('memberPlanEdit.externalReward')}
              </Form.ControlLabel>

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
        <Panel bordered>
          <Row>
            {/* tags */}
            <Col xs={24}>
              <Form.ControlLabel>{t('memberPlanEdit.tags')}</Form.ControlLabel>
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

            {/* Currency */}
            <Col xs={24}>
              <Form.ControlLabel>
                {t('memberPlanEdit.currency')}
              </Form.ControlLabel>
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
            </Col>

            {/* minimal monthly amount */}
            <Col xs={12}>
              <Form.ControlLabel>
                {t('memberPlanEdit.amountPerMonthMin')}
              </Form.ControlLabel>
              <CurrencyInput
                name="amountPerMonthMin"
                currency={memberPlan?.currency ?? 'CHF'}
                centAmount={memberPlan?.amountPerMonthMin || 0}
                disabled={loading}
                onChange={centAmount => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({
                    ...memberPlan,
                    amountPerMonthMin: centAmount || 0,
                  });
                }}
              />
              <HelpText>
                {t('memberplanForm.amountPerMonthMinHelpText')}
              </HelpText>
            </Col>

            {/* maximal monthly amount */}
            <Col xs={12}>
              <Form.ControlLabel>
                {t('memberPlanEdit.amountPerMonthMax')}
              </Form.ControlLabel>
              <CurrencyInput
                name="amountPerMonthMax"
                currency={memberPlan?.currency ?? 'CHF'}
                centAmount={memberPlan?.amountPerMonthMax ?? null}
                disabled={loading}
                onChange={centAmount => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({
                    ...memberPlan,
                    amountPerMonthMax: centAmount ?? null,
                  });
                }}
              />
              <HelpText>
                {t('memberplanForm.amountPerMonthMaxHelpText')}
              </HelpText>
            </Col>

            {/* target monthly amount */}
            <Col xs={12}>
              <Form.ControlLabel>
                {t('memberplanForm.amountPerMonthTarget')}
              </Form.ControlLabel>
              <CurrencyInput
                name="amountPerMonthTarget"
                currency={memberPlan?.currency ?? 'CHF'}
                centAmount={memberPlan?.amountPerMonthTarget || 0}
                disabled={loading}
                onChange={centAmount => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({
                    ...memberPlan,
                    amountPerMonthTarget: centAmount || null,
                  });
                }}
              />
              <HelpText>
                {t('memberplanForm.amountPerMonthTargetHelpText')}
              </HelpText>
            </Col>
          </Row>
        </Panel>
      </Col>

      {/* payment method settings */}
      <Col xs={12}>
        <Panel
          header={t('memberPlanEdit.paymentConfigs')}
          bordered
        >
          <Row>
            <Col xs={24}>
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
                        <FormControlLabelMarginRight>
                          {t('memberPlanEdit.forceAutoRenewal')}
                        </FormControlLabelMarginRight>
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
                        <Form.HelpText>
                          {t('memberPlanEdit.autoRenewalDescription')}
                        </Form.HelpText>
                      </Col>

                      {/* payment periodicity */}
                      <Col xs={24}>
                        <Form.ControlLabel>
                          {t('memberPlanList.paymentPeriodicities')}
                        </Form.ControlLabel>
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
                        <Form.ControlLabel>
                          {t('memberPlanList.paymentMethods')}
                        </Form.ControlLabel>
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

                      {availablePaymentMethods.length > 1 && (
                        <Col xs={24}>
                          <Divider />
                        </Col>
                      )}
                    </Row>
                  </Panel>
                )}
              </ListInput>
            </Col>

            <Col xs={24}>
              <Row>
                <Form.ControlLabel>
                  {t('memberPlanEdit.successPage')}
                </Form.ControlLabel>
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
                <Form.ControlLabel>
                  {t('memberPlanEdit.failPage')}
                </Form.ControlLabel>
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
                <Form.ControlLabel>
                  {t('memberplanForm.confirmationPage')}
                </Form.ControlLabel>
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
              <HelpText>
                {t('memberplanForm.confirmationPageHelptext')}
              </HelpText>
            </Col>
          </Row>
        </Panel>
      </Col>

      <Col xs={12}>
        <Panel
          header={t('memberplanForm.trialSubscription')}
          bordered
        >
          {/* automatically configure trial subscription */}
          <Row>
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
          </Row>
          <RowPaddingTop>
            {/* extendable */}
            <Col xs={12}>
              <Toggle
                checked={memberPlan?.extendable}
                onChange={extendable => setExtendable(extendable)}
              />
              <FormControlLabelMarginLeft>
                {t('memberplanForm.extendableToggle')}
              </FormControlLabelMarginLeft>
              <HelpText>{t('memberplanForm.extendableHelpText')}</HelpText>
            </Col>
            {/* max count */}
            <Col xs={12}>
              <ControlLabel>{maxCountLabel}</ControlLabel>
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
              <HelpText>{maxCountHelpText}</HelpText>
            </Col>
          </RowPaddingTop>
          <RowPaddingTop>
            <Col xs={12}>
              <ControlLabel>{t('memberplanForm.migratePMTitle')}</ControlLabel>
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
              <HelpText>{t('memberplanForm.migratePMHelptext')}</HelpText>
            </Col>
          </RowPaddingTop>
        </Panel>
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
