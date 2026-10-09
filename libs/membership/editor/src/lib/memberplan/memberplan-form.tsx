import React, { Dispatch, SetStateAction, useMemo, useState } from 'react';
import {
  Currency,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullImageFragment,
  PaymentPeriodicity,
  ProductType,
  FullAvailablePaymentMethodFragment,
} from '@wepublish/editor/api';
import {
  CheckPicker,
  Form as RForm,
  Form,
  Input,
  SelectPicker,
  TagPicker,
} from 'rsuite';
import { useTranslation } from 'react-i18next';
import { slugify } from '@wepublish/utils';
import {
  ALL_PAYMENT_PERIODICITIES,
  ChooseEditImage,
  ImageEditPanel,
  ImageSelectPanel,
  InfoTooltip,
  ListInput,
  ListValue,
  RichTextBlock,
  RichTextBlockValue,
  SelectPage,
  enqueueSnackbar,
  DRAWER_WIDTHS,
} from '@wepublish/ui/editor';
import { MdAutoFixHigh, MdCheck, MdExpandMore } from 'react-icons/md';
import { MemberPlanPricing } from './memberplan-pricing';
import {
  Alert,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Drawer,
  Card,
  CardContent,
  CardHeader,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card as MuiCard,
  Grid,
  Grid as MuiGrid,
} from '@mui/material';
import styled from '@emotion/styled';

const { Label, Text, Control } = RForm;

const ColTextAlignEnd = styled(MuiGrid)`
  text-align: end;
`;

const PanelWidth100 = styled(MuiCard)`
  width: 100%;
`;

const RowPaddingTop = styled(MuiGrid)`
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
      enqueueSnackbar(t('memberplanForm.trialSubscriptionNotPossible'), {
        variant: 'error',
        autoHideDuration: 6000,
      });

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
      enqueueSnackbar(t('memberplanForm.forceAutoRenewNotPossible'), {
        variant: 'error',
      });

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
    <Grid
      container
      spacing={2}
    >
      <Grid size={{ xs: 6 }}>
        <PanelWidth100>
          <CardContent>
            <CardContent>
              <Grid
                container
                spacing={2}
              >
                {/* product type */}
                <Grid size={{ xs: 12 }}>
                  <Form.Label>{t('memberplanForm.productType')}</Form.Label>
                  <SelectPicker
                    block
                    cleanable={false}
                    searchable={false}
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
                </Grid>

                {/* image */}
                <Grid size={{ xs: 6 }}>
                  <ChooseEditImage
                    image={memberPlan?.image}
                    disabled={loading}
                    openChooseModalOpen={() => setChooseModalOpen(true)}
                    openEditModalOpen={() => setEditModalOpen(true)}
                    removeImage={() => {
                      if (!memberPlan) {
                        return;
                      }
                      setMemberPlan({ ...memberPlan, image: null });
                    }}
                  />
                </Grid>

                {/* active / inactive */}
                <ColTextAlignEnd size={{ xs: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!memberPlan?.active}
                        disabled={loading}
                        onChange={(_event, active) => {
                          if (!memberPlan) {
                            return;
                          }
                          setMemberPlan({ ...memberPlan, active });
                        }}
                      />
                    }
                    label={t('memberPlanEdit.active')}
                  />
                  <Text>{t('memberPlanEdit.activeDescription')}</Text>
                </ColTextAlignEnd>

                <Grid size={{ xs: 12 }}>
                  <Grid
                    container
                    spacing={2}
                  >
                    {/* name */}
                    <Grid size={{ xs: 6 }}>
                      <Form.Label>{t('memberPlanEdit.name')}</Form.Label>
                      <Form.Control
                        name="name"
                        value={memberPlan?.name || ''}
                        onChange={(newName: string | undefined) =>
                          updateName(newName)
                        }
                      />
                    </Grid>

                    {/* slug */}
                    <Grid size={{ xs: 6 }}>
                      <Form.Label>
                        {t('memberPlanEdit.slug')}{' '}
                        <InfoTooltip text={t('memberPlanEdit.slugHelp')} />
                      </Form.Label>
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
                    </Grid>
                  </Grid>
                </Grid>

                {/* description */}
                <Grid size={{ xs: 12 }}>
                  <Form.Label>
                    {t('memberPlanEdit.description')}{' '}
                    <InfoTooltip text={t('memberPlanEdit.descriptionHelp')} />
                  </Form.Label>

                  <RichTextBlock
                    value={memberPlan?.description}
                    disabled={loading}
                    onChange={newDescription => {
                      if (memberPlan) {
                        setMemberPlan({
                          ...memberPlan,
                          description:
                            (newDescription as RichTextBlockValue['richText']) ??
                            null,
                        });
                      }
                    }}
                  />
                </Grid>

                {/* short description */}
                <Grid size={{ xs: 12 }}>
                  <Form.Label>
                    {t('memberPlanEdit.shortDescription')}{' '}
                    <InfoTooltip
                      text={t('memberPlanEdit.shortDescriptionHelp')}
                    />
                  </Form.Label>

                  <RichTextBlock
                    value={memberPlan?.shortDescription}
                    disabled={loading}
                    onChange={newShortDescription => {
                      if (memberPlan) {
                        setMemberPlan({
                          ...memberPlan,
                          shortDescription:
                            (newShortDescription as RichTextBlockValue['richText']) ??
                            null,
                        });
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
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
                        externalReward: newexternalReward ?? null,
                      });
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </CardContent>
        </PanelWidth100>
      </Grid>

      <Grid size={{ xs: 6 }}>
        <Card variant="outlined">
          <CardHeader title={t('memberplanForm.trialSubscription')} />

          <CardContent>
            {/* tags */}
            <Grid
              container
              spacing={2}
            >
              <Grid size={{ xs: 12 }}>
                <Form.Label>{t('memberPlanEdit.tags')}</Form.Label>
                <TagPicker
                  block
                  disabled={loading}
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
              </Grid>
            </Grid>

            {/* automatically configure trial subscription */}
            <RowPaddingTop>
              <Grid size={{ xs: 12 }}>
                {isTrialSubscription ?
                  <Alert
                    icon={<MdCheck />}
                    severity="success"
                  >
                    {t('memberplanForm.trialMemberplanAlert')}
                  </Alert>
                : <>
                    <Button
                      variant="outlined"
                      startIcon={<MdAutoFixHigh />}
                      onClick={() =>
                        setExtendable(
                          false,
                          memberPlan ?
                            { ...memberPlan, maxCount: 1 }
                          : undefined
                        )
                      }
                      disabled={isTrialSubscription}
                      color="success"
                    >
                      {t('memberplanForm.configureTrialBtn')}
                    </Button>{' '}
                    <InfoTooltip
                      text={t('memberplanForm.configureTrialHelp')}
                    />
                  </>
                }
              </Grid>
            </RowPaddingTop>
            <RowPaddingTop>
              {/* extendable */}
              <Grid size={{ xs: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={memberPlan?.extendable}
                      onChange={(_event, extendable) =>
                        setExtendable(extendable)
                      }
                    />
                  }
                  label={
                    <>
                      {t('memberplanForm.extendableToggle')}{' '}
                      <InfoTooltip
                        text={t('memberplanForm.extendableHelpText')}
                      />
                    </>
                  }
                />
              </Grid>
              {/* max count */}
              <Grid size={{ xs: 6 }}>
                <Label>
                  {maxCountLabel} <InfoTooltip text={maxCountHelpText} />
                </Label>
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
              </Grid>
            </RowPaddingTop>
            <RowPaddingTop>
              <Grid size={{ xs: 6 }}>
                <Label>
                  {t('memberplanForm.migratePMTitle')}{' '}
                  <InfoTooltip text={t('memberplanForm.migratePMHelptext')} />
                </Label>
                <Control
                  block
                  name="migrateToTargetPaymentMethodID"
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
              </Grid>
            </RowPaddingTop>

            {/* redirections */}
            <DividerTextAlignLeft>
              {t('memberplanForm.redirectionsTitle')}
            </DividerTextAlignLeft>
            <Grid
              container
              spacing={2}
            >
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
            </Grid>

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
              <Form.Label>
                {t('memberplanForm.confirmationPage')}{' '}
                <InfoTooltip
                  text={t('memberplanForm.confirmationPageHelptext')}
                />
              </Form.Label>
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
          </CardContent>
        </Card>
      </Grid>

      {/* payment method settings */}
      <Grid size={{ xs: 12 }}>
        <PanelWidth100>
          <CardContent>
            <CardHeader title={t('memberPlanEdit.paymentConfigs')} />

            <CardContent>
              <Grid
                container
                spacing={2}
              >
                {/* currency */}
                <Grid size={{ xs: 6 }}>
                  <Form.Label>{t('memberPlanEdit.currency')}</Form.Label>
                  <SelectPicker
                    block
                    name="currency"
                    cleanable={false}
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
                    <Grid size={{ xs: 12 }}>
                      <Form.Label>
                        {t('memberplanForm.defaultPaymentPeriodicity')}
                      </Form.Label>
                      <SelectPicker
                        block
                        cleanable
                        searchable={false}
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
                    </Grid>
                  </RowPaddingTop>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <ListInput
                    value={availablePaymentMethods}
                    disabled={loading}
                    onChange={app => setAvailablePaymentMethods(app)}
                    defaultValue={{
                      __typename: 'AvailablePaymentMethod',
                      forceAutoRenewal: false,
                      paymentPeriodicities: [],
                      paymentMethods: [],
                    }}
                  >
                    {({ value, onChange }) => (
                      <Accordion style={{ width: '100%' }}>
                        <AccordionSummary expandIcon={<MdExpandMore />}>
                          t('memberPlanEdit.editPaymentSetting')
                        </AccordionSummary>

                        <AccordionDetails>
                          <Grid
                            container
                            spacing={2}
                          >
                            {/* force auto-renew */}
                            <Grid size={{ xs: 12 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={value.forceAutoRenewal}
                                    disabled={loading}
                                    onChange={(_event, forceAutoRenewal) =>
                                      setForceAutoRenewal(
                                        forceAutoRenewal,
                                        onChange,
                                        value
                                      )
                                    }
                                  />
                                }
                                label={
                                  <>
                                    {t('memberPlanEdit.forceAutoRenewal')}{' '}
                                    <InfoTooltip
                                      text={t(
                                        'memberPlanEdit.forceAutoRenewalHelp'
                                      )}
                                    />
                                  </>
                                }
                              />
                            </Grid>

                            {/* payment periodicity */}
                            <Grid size={{ xs: 12 }}>
                              <Form.Label>
                                {t('memberPlanList.paymentPeriodicities')}
                              </Form.Label>
                              <CheckPicker
                                block
                                virtualized
                                value={value.paymentPeriodicities}
                                data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                                  value: pp,
                                  label: t(
                                    `memberPlanList.paymentPeriodicity.${pp}`
                                  ),
                                }))}
                                onChange={paymentPeriodicities =>
                                  onChange({ ...value, paymentPeriodicities })
                                }
                                placement="auto"
                                cleanable
                              />
                            </Grid>

                            {/* payment method selection */}
                            <Grid size={{ xs: 12 }}>
                              <Form.Label>
                                {t('memberPlanList.paymentMethods')}
                              </Form.Label>
                              <CheckPicker
                                block
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
                                        paymentMethods.find(
                                          pm => pm.id === pmID
                                        )
                                      )
                                      .filter(pm => pm !== undefined),
                                  });
                                }}
                                placement="auto"
                              />
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </ListInput>
                </Grid>
              </Grid>
            </CardContent>
          </CardContent>
        </PanelWidth100>
      </Grid>

      {/* pricing */}
      <Grid size={{ xs: 12 }}>
        <MemberPlanPricing
          memberPlan={memberPlan}
          availablePaymentMethods={availablePaymentMethods}
          loading={loading}
          setMemberPlan={setMemberPlan}
        />
      </Grid>

      {/* image upload and selection */}
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
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
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
          open={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={memberPlan.image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </Grid>
  );
}
