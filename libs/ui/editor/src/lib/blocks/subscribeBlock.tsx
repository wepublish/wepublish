import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  PaymentPeriodicity,
  ProductType,
  SubscribeBlockField,
  SubscribeBlockLayoutPickerConfig,
  SubscribeBlockLayoutSliderConfig,
  SubscribeBlockRenderLayout,
  SubscribePeriodicityDisplay,
  useMemberPlanListQuery,
} from '@wepublish/editor/api';
import { ReactNode, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDragIndicator } from 'react-icons/md';
import type { CheckPickerProps } from 'rsuite';
import {
  Checkbox,
  CheckPicker,
  IconButton,
  NumberInput,
  Panel as RPanel,
  Radio,
  RadioGroup,
  SelectPicker,
  TagInput,
  Toggle,
} from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { SubscribeBlockValue } from './types';

const Panel = styled(RPanel)`
  display: grid;
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;

  .rs-panel-body {
    display: grid;
    gap: 24px;
  }
`;

const Content = styled.div`
  display: grid;
  gap: 12px;
`;

const Heading = styled('p')`
  margin: 0;
  font-weight: 600;
`;

const Hint = styled('p')`
  margin: 0;
  font-size: 12px;
  color: #6c757d;
`;

const SettingLabel = styled('span', {
  shouldForwardProp: prop => prop !== 'deactivated',
})<{ deactivated?: boolean }>`
  font-size: 14px;

  ${({ deactivated }) =>
    deactivated &&
    css`
      color: var(--rs-text-disabled, #c5c6c7);
    `}
`;

const GoodieMinValueInput = styled(NumberInput)`
  max-width: 150px;
`;

const GoodieMinValueRow = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const GoodiesToggleRow = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const SmallCheckbox = styled(Checkbox)`
  .rs-checkbox-checker {
    min-height: auto;
    padding: 0 0 0 24px;
    font-size: 12px;
    line-height: 1.4;
  }

  .rs-checkbox-wrapper {
    top: 0;
    left: 0;
    transform: scale(0.85);
    transform-origin: left center;
  }
`;

const PlanStyleRow = styled('div')`
  display: grid;
  grid-template-columns: max-content 1fr max-content max-content;
  gap: 12px;
  align-items: center;
`;

const PlanDefaultToggle = styled(Toggle)`
  white-space: nowrap;
`;

const PlanStyleName = styled('span')`
  font-size: 14px;
`;

const PlanAmounts = styled('span')`
  width: 150px;
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
`;

const PickerSettings = styled('div')`
  display: grid;
  gap: 12px;
  align-items: center;
`;

const PlanRowWrapper = styled('div')`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
`;

const SettingRowContent = styled('div')`
  display: grid;
  gap: 12px;
  background: #fff;
  border-radius: 3px;
  padding: 12px;
`;

const SettingRow = styled('div')`
  display: grid;
  gap: 12px;
`;

type SortablePlanRowProps = {
  id: string;
  disabled?: boolean;
  children: ReactNode;
};

const SortablePlanRow = ({ id, disabled, children }: SortablePlanRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <PlanRowWrapper
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
        position: 'relative',
      }}
    >
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
      >
        <IconButton
          icon={<MdDragIndicator />}
          appearance="subtle"
          disabled={disabled}
        />
      </div>

      {children}
    </PlanRowWrapper>
  );
};

export const renderLayouts: SubscribeBlockRenderLayout[] = [
  SubscribeBlockRenderLayout.None,
  SubscribeBlockRenderLayout.Slider,
  SubscribeBlockRenderLayout.Picker,
];

const formatValues = (value: number[] | null | undefined) =>
  (value ?? []).map(tileValue =>
    tileValue % 100 === 0 ?
      String(tileValue / 100)
    : (tileValue / 100).toFixed(2)
  );

const formatPlanAmount = (amount: number | null | undefined) =>
  amount != null ? (amount / 100).toFixed(2) : '–';

const PERIODICITY_ORDER = [
  PaymentPeriodicity.Monthly,
  PaymentPeriodicity.Quarterly,
  PaymentPeriodicity.Biannual,
  PaymentPeriodicity.Yearly,
  PaymentPeriodicity.Biennial,
  PaymentPeriodicity.Lifetime,
];

const PERIODICITY_MONTHS: Record<PaymentPeriodicity, number> = {
  [PaymentPeriodicity.Monthly]: 1,
  [PaymentPeriodicity.Quarterly]: 3,
  [PaymentPeriodicity.Biannual]: 6,
  [PaymentPeriodicity.Yearly]: 12,
  [PaymentPeriodicity.Biennial]: 24,
  [PaymentPeriodicity.Lifetime]: 1200,
};

type PlanForPeriodAmount = {
  amountPerMonthMin: number;
  amountPerMonthTarget?: number | null;
  amountPerMonthMax?: number | null;
  defaultPaymentPeriodicity?: PaymentPeriodicity | null;
  periodicityPricing?: Array<{
    periodicity: PaymentPeriodicity;
    amountMin?: number | null;
    amountTarget?: number | null;
    amountMax?: number | null;
  }> | null;
  availablePaymentMethods?: Array<{
    paymentPeriodicities: PaymentPeriodicity[];
  }> | null;
};

const getPlanPeriodicities = (
  plan: PlanForPeriodAmount
): PaymentPeriodicity[] =>
  PERIODICITY_ORDER.filter(periodicity =>
    plan.availablePaymentMethods?.some(paymentMethod =>
      paymentMethod.paymentPeriodicities.includes(periodicity)
    )
  );

const getDefaultPeriodicity = (
  plan: PlanForPeriodAmount
): PaymentPeriodicity => {
  const periodicities = getPlanPeriodicities(plan);

  if (
    plan.defaultPaymentPeriodicity &&
    periodicities.includes(plan.defaultPaymentPeriodicity)
  ) {
    return plan.defaultPaymentPeriodicity;
  }

  return periodicities[0] ?? PaymentPeriodicity.Yearly;
};

const calculatePeriodAmount = (
  monthlyAmount: number,
  periodicity: PaymentPeriodicity
) => Math.round(monthlyAmount * PERIODICITY_MONTHS[periodicity]);

const getPeriodPriceRange = (
  plan: PlanForPeriodAmount,
  periodicity: PaymentPeriodicity
) => {
  const override =
    periodicity === PaymentPeriodicity.Monthly ?
      undefined
    : plan.periodicityPricing?.find(price => price.periodicity === periodicity);

  return {
    amountMin:
      override?.amountMin ??
      calculatePeriodAmount(plan.amountPerMonthMin, periodicity),
    amountTarget:
      override?.amountTarget ??
      (plan.amountPerMonthTarget != null ?
        calculatePeriodAmount(plan.amountPerMonthTarget, periodicity)
      : null),
    amountMax:
      override?.amountMax ??
      (plan.amountPerMonthMax != null ?
        calculatePeriodAmount(plan.amountPerMonthMax, periodicity)
      : null),
  };
};

const formatPlanDefaultPeriodicityAmounts = (
  plan: PlanForPeriodAmount | undefined,
  currency: string | null | undefined,
  periodicityLabel: (periodicity: PaymentPeriodicity) => string
) => {
  if (!plan) {
    return '';
  }

  const periodicity = getDefaultPeriodicity(plan);
  const { amountMin, amountTarget, amountMax } = getPeriodPriceRange(
    plan,
    periodicity
  );

  const amounts = [amountMin, amountTarget, amountMax]
    .map(formatPlanAmount)
    .join(' / ');

  return [currency, amounts, `(${periodicityLabel(periodicity)})`]
    .filter(Boolean)
    .join(' ');
};

export const SubscribeBlock = ({
  value,
  onChange,
  disabled,
}: BlockProps<SubscribeBlockValue>) => {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const { data, loading } = useMemberPlanListQuery({
    variables: {
      take: 200,
      filter: {
        active: true,
      },
    },
  });

  const productTypeLabels = useMemo(
    () => ({
      [ProductType.Subscription]: t('memberPlanEdit.productTypeSubscription'),
      [ProductType.Donation]: t('memberPlanEdit.productTypeDonation'),
    }),
    [t]
  );

  const memberPlanOptions = useMemo(
    () =>
      (data?.memberPlans?.nodes ?? []).map(memberPlan => ({
        value: memberPlan.id,
        label: memberPlan.name,
        group: productTypeLabels[memberPlan.productType],
      })),
    [data?.memberPlans?.nodes, productTypeLabels]
  );

  const memberPlanById = useMemo(
    () =>
      new Map(
        (data?.memberPlans?.nodes ?? []).map(memberPlan => [
          memberPlan.id,
          memberPlan,
        ])
      ),
    [data?.memberPlans?.nodes]
  );

  const handleMemberPlansChange = useCallback<
    NonNullable<CheckPickerProps<string>['onChange']>
  >(
    (memberPlanIds, _event) => {
      onChange(current => {
        const hasDefault = current.memberPlanRenderSettings.some(
          ({ isDefault, memberPlanId }) =>
            memberPlanIds.includes(memberPlanId) && isDefault
        );

        return {
          ...current,
          memberPlanIds: memberPlanIds ?? [],
          memberPlanRenderSettings: (memberPlanIds ?? []).map(
            (memberPlanId, index) => {
              const existingSetting = current.memberPlanRenderSettings.find(
                plan => plan.memberPlanId === memberPlanId
              );

              // When default gets removed
              if (existingSetting && !hasDefault && index === 0) {
                return {
                  ...existingSetting,
                  isDefault: true,
                };
              }

              return (
                existingSetting ?? {
                  memberPlanId,
                  isDefault: !hasDefault,
                  layout: {
                    type: SubscribeBlockRenderLayout.Slider,
                    showInput: false,
                  },
                }
              );
            }
          ),
        };
      });
    },
    [onChange]
  );

  const handlePlanDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) {
        return;
      }

      onChange(current => {
        const currentPlans = current.memberPlanRenderSettings;

        const oldIndex = currentPlans.findIndex(
          ({ memberPlanId }) => memberPlanId === active.id
        );
        const newIndex = currentPlans.findIndex(
          ({ memberPlanId }) => memberPlanId === over.id
        );

        if (oldIndex < 0 || newIndex < 0) {
          return current;
        }

        const memberPlanRenderSettings = arrayMove(
          currentPlans,
          oldIndex,
          newIndex
        );

        return {
          ...current,
          memberPlanRenderSettings,
          memberPlanIds: memberPlanRenderSettings.map(
            ({ memberPlanId }) => memberPlanId
          ),
        };
      });
    },
    [onChange]
  );

  const handlePlanLayoutChange = useCallback(
    (memberPlanId: string, layoutType: SubscribeBlockRenderLayout | null) => {
      if (!layoutType) {
        return;
      }

      onChange(current => ({
        ...current,
        memberPlanRenderSettings: current.memberPlanRenderSettings.map(
          setting => {
            if (setting.memberPlanId !== memberPlanId) {
              return setting;
            }

            switch (layoutType) {
              case SubscribeBlockRenderLayout.Picker: {
                return {
                  ...setting,
                  layout: {
                    type: layoutType,
                    showInput: true,
                    values: [],
                  },
                };
              }

              default: {
                return {
                  ...setting,
                  layout: {
                    type: layoutType,
                  },
                };
              }
            }
          }
        ),
      }));
    },
    [onChange]
  );

  const handleFixedAmountsChange = useCallback(
    (memberPlanId: string, tileValues: readonly string[]) => {
      onChange(current => ({
        ...current,
        memberPlanRenderSettings: current.memberPlanRenderSettings.map(
          setting => {
            if (setting.memberPlanId !== memberPlanId) {
              return setting;
            }

            return {
              ...setting,
              layout: {
                ...setting.layout,
                values: Array.from(
                  new Set(
                    tileValues
                      .map(value => parseFloat(value) * 100)
                      .sort((a, b) => a - b)
                  ).values()
                ),
              },
            };
          }
        ),
      }));
    },
    [onChange]
  );

  const handleShowAmountInputChange = useCallback(
    (memberPlanId: string, showInput: boolean) => {
      onChange(current => ({
        ...current,
        memberPlanRenderSettings: current.memberPlanRenderSettings.map(
          setting => {
            if (setting.memberPlanId !== memberPlanId) {
              return setting;
            }

            return {
              ...setting,
              layout: {
                ...setting.layout,
                showInput,
              },
            };
          }
        ),
      }));
    },
    [onChange]
  );

  const handlePlanDefaultChange = useCallback(
    (memberPlanId: string, isDefault: boolean) => {
      if (!isDefault) {
        return;
      }

      onChange(current => ({
        ...current,
        memberPlanRenderSettings: current.memberPlanRenderSettings.map(
          setting => ({
            ...setting,
            isDefault: setting.memberPlanId === memberPlanId,
          })
        ),
      }));
    },
    [onChange]
  );

  const renderLayoutOptions = useMemo(
    () =>
      renderLayouts.map(layout => ({
        value: layout,
        label: t(`blocks.subscribe.renderLayouts.${layout}`),
      })),
    [t]
  );

  const handleFieldsChange = useCallback<
    NonNullable<CheckPickerProps<string>['onChange']>
  >(
    (fields, _event) => {
      onChange(current => ({
        ...current,
        fields: (fields as SubscribeBlockField[]) ?? [],
      }));
    },
    [onChange]
  );

  const handleShowGoodiesChange = useCallback(
    (_value: unknown, checked: boolean) => {
      onChange(current => ({ ...current, showGoodies: checked }));
    },
    [onChange]
  );

  const handleShowDiscountCodesChange = useCallback(
    (_value: unknown, checked: boolean) => {
      onChange(current => ({ ...current, showDiscountCodes: checked }));
    },
    [onChange]
  );

  const handleGoodieMinValueChange = useCallback(
    (nextValue: string | number | null) => {
      const francs =
        typeof nextValue === 'number' ? nextValue
        : nextValue != null ? Number.parseFloat(nextValue.replace(',', '.'))
        : Number.NaN;

      onChange(current => ({
        ...current,
        goodieMinValue:
          Number.isFinite(francs) && francs > 0 ?
            Math.round(francs * 100)
          : null,
      }));
    },
    [onChange]
  );

  const handleHideRepeatGoodieOnUpgradeChange = useCallback(
    (_value: unknown, checked: boolean) => {
      onChange(current => ({ ...current, hideRepeatGoodieOnUpgrade: checked }));
    },
    [onChange]
  );

  const handleGoodieMinValueAppliesToUpgradeChange = useCallback(
    (_value: unknown, checked: boolean) => {
      onChange(current => ({
        ...current,
        goodieMinValueAppliesToUpgrade: checked,
      }));
    },
    [onChange]
  );

  return (
    <Panel bordered>
      <Content>
        <Heading>{t('blocks.subscribe.selectMemberPlans')}</Heading>

        <CheckPicker
          cleanable
          block
          disabled={disabled}
          loading={loading}
          searchable
          data={memberPlanOptions}
          value={value.memberPlanIds}
          onChange={handleMemberPlansChange}
          placeholder={t('blocks.subscribe.selectMemberPlansPlaceholder')}
        />

        {!!value.memberPlanIds.length && (
          <Hint>{t('blocks.subscribe.selectMemberPlansSelectionHintAll')}</Hint>
        )}

        {!!value.memberPlanRenderSettings.length && (
          <>
            <Heading>{t('blocks.subscribe.renderStylesHeading')}</Heading>

            <DndContext
              sensors={sensors}
              onDragEnd={handlePlanDragEnd}
            >
              <SortableContext
                items={value.memberPlanRenderSettings.map(
                  ({ memberPlanId }) => memberPlanId
                )}
                strategy={verticalListSortingStrategy}
              >
                <SettingRow>
                  {value.memberPlanRenderSettings.map(plan => (
                    <SortablePlanRow
                      key={plan.memberPlanId}
                      id={plan.memberPlanId}
                      disabled={disabled}
                    >
                      <SettingRowContent>
                        <PlanStyleRow>
                          <PlanStyleName>
                            {memberPlanOptions.find(
                              ({ value: id }) => id === plan.memberPlanId
                            )?.label ?? plan.memberPlanId}
                          </PlanStyleName>

                          <PlanAmounts
                            title={t('blocks.subscribe.planAmountsTitle')}
                          >
                            {formatPlanDefaultPeriodicityAmounts(
                              memberPlanById.get(plan.memberPlanId),
                              memberPlanById.get(plan.memberPlanId)?.currency,
                              periodicity =>
                                t(
                                  `memberPlanList.paymentPeriodicity.${periodicity}`
                                )
                            )}
                          </PlanAmounts>

                          <SelectPicker
                            cleanable={false}
                            searchable={false}
                            disabled={disabled}
                            data={renderLayoutOptions}
                            value={plan.layout.type}
                            onChange={renderLayout =>
                              handlePlanLayoutChange(
                                plan.memberPlanId,
                                renderLayout
                              )
                            }
                          />

                          <PlanDefaultToggle
                            checked={!!plan.isDefault}
                            disabled={disabled}
                            size="sm"
                            title={t('blocks.subscribe.defaultPlanTitle')}
                            checkedChildren={t(
                              'blocks.subscribe.defaultPlanLabel'
                            )}
                            unCheckedChildren={t(
                              'blocks.subscribe.defaultPlanLabel'
                            )}
                            onChange={checked =>
                              handlePlanDefaultChange(
                                plan.memberPlanId,
                                checked
                              )
                            }
                          />
                        </PlanStyleRow>

                        {plan.layout.type ===
                          SubscribeBlockRenderLayout.Slider && (
                          <PickerSettings>
                            <div>
                              <Checkbox
                                checked={
                                  (
                                    plan.layout as SubscribeBlockLayoutSliderConfig
                                  ).showInput
                                }
                                disabled={disabled}
                                title={t(
                                  'blocks.subscribe.showAmountInput.title'
                                )}
                                onChange={(_value, checked) =>
                                  handleShowAmountInputChange(
                                    plan.memberPlanId,
                                    checked
                                  )
                                }
                              >
                                <Hint>
                                  {t('blocks.subscribe.showAmountInput.label')}
                                </Hint>
                              </Checkbox>
                            </div>
                          </PickerSettings>
                        )}

                        {plan.layout.type ===
                          SubscribeBlockRenderLayout.Picker && (
                          <PickerSettings>
                            <div>
                              <Checkbox
                                checked={
                                  (
                                    plan.layout as SubscribeBlockLayoutPickerConfig
                                  ).showInput
                                }
                                disabled={disabled}
                                title={t(
                                  'blocks.subscribe.showAmountInput.title'
                                )}
                                onChange={(_value, checked) =>
                                  handleShowAmountInputChange(
                                    plan.memberPlanId,
                                    checked
                                  )
                                }
                              >
                                <Hint>
                                  {t('blocks.subscribe.showAmountInput.label')}
                                </Hint>
                              </Checkbox>
                            </div>

                            <div>
                              <Hint>
                                {t('blocks.subscribe.amountTileValues.hint')}
                              </Hint>

                              <TagInput
                                disabled={disabled}
                                trigger={['Enter', 'Space', 'Comma']}
                                placeholder={t(
                                  'blocks.subscribe.amountTileValues.placeholder'
                                )}
                                value={formatValues(
                                  (
                                    plan.layout as SubscribeBlockLayoutPickerConfig
                                  ).values
                                )}
                                onChange={tileValues =>
                                  handleFixedAmountsChange(
                                    plan.memberPlanId,
                                    tileValues
                                  )
                                }
                              />
                            </div>
                          </PickerSettings>
                        )}
                      </SettingRowContent>
                    </SortablePlanRow>
                  ))}
                </SettingRow>
              </SortableContext>
            </DndContext>
          </>
        )}
      </Content>

      <Content>
        <Heading>{t('blocks.subscribe.goodiesHeading')}</Heading>

        <GoodiesToggleRow>
          <Toggle
            checked={value.showGoodies}
            disabled={disabled}
            onChange={checked => handleShowGoodiesChange(undefined, checked)}
          >
            {t('blocks.subscribe.showGoodies')}
          </Toggle>

          <SmallCheckbox
            checked={value.hideRepeatGoodieOnUpgrade}
            disabled={disabled || !value.showGoodies}
            onChange={handleHideRepeatGoodieOnUpgradeChange}
          >
            {t('blocks.subscribe.hideRepeatGoodieOnUpgrade')}
          </SmallCheckbox>
        </GoodiesToggleRow>

        <div>
          <SettingLabel deactivated={disabled || !value.showGoodies}>
            {t('blocks.subscribe.goodieMinValue.label')}
          </SettingLabel>

          <GoodieMinValueRow>
            <GoodieMinValueInput
              disabled={disabled || !value.showGoodies}
              min={0}
              step={1}
              value={
                value.goodieMinValue != null ? value.goodieMinValue / 100 : ''
              }
              onChange={handleGoodieMinValueChange}
            />

            <SmallCheckbox
              checked={value.goodieMinValueAppliesToUpgrade}
              disabled={
                disabled || !value.showGoodies || value.goodieMinValue == null
              }
              onChange={handleGoodieMinValueAppliesToUpgradeChange}
            >
              {t('blocks.subscribe.goodieMinValueAppliesToUpgrade')}
            </SmallCheckbox>
          </GoodieMinValueRow>
        </div>
      </Content>

      <Content>
        <Heading>{t('blocks.subscribe.discountCodesHeading')}</Heading>

        <Toggle
          checked={value.showDiscountCodes}
          disabled={disabled}
          onChange={checked =>
            handleShowDiscountCodesChange(undefined, checked)
          }
        >
          {t('blocks.subscribe.showDiscountCodes')}
        </Toggle>
      </Content>

      <Content>
        <Heading>{t('blocks.subscribe.selectFields')}</Heading>

        <CheckPicker
          block
          disabled={disabled}
          data={[
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.FirstName}`),
              value: SubscribeBlockField.FirstName,
            },
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.Birthday}`),
              value: SubscribeBlockField.Birthday,
            },
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.Address}`),
              value: SubscribeBlockField.Address,
            },
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.EmailRepeated}`),
              value: SubscribeBlockField.EmailRepeated,
            },
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.Password}`),
              value: SubscribeBlockField.Password,
            },
            {
              label: t(
                `blocks.subscribe.${SubscribeBlockField.PasswordRepeated}`
              ),
              value: SubscribeBlockField.PasswordRepeated,
            },
          ]}
          value={value.fields}
          onChange={handleFieldsChange}
        />

        <Hint>{t('blocks.subscribe.selectFieldsSelectionHint')}</Hint>
      </Content>

      <Content>
        <Heading>{t('blocks.subscribe.periodicityDisplay')}</Heading>

        <RadioGroup
          inline
          disabled={disabled}
          value={
            value.periodicityDisplay ?? SubscribePeriodicityDisplay.Dropdown
          }
          onChange={periodicityDisplay =>
            onChange(current => ({
              ...current,
              periodicityDisplay:
                periodicityDisplay as SubscribePeriodicityDisplay,
            }))
          }
        >
          <Radio value={SubscribePeriodicityDisplay.Dropdown}>
            {t('blocks.subscribe.periodicityDisplayDropdown')}
          </Radio>
          <Radio value={SubscribePeriodicityDisplay.OfferCards}>
            {t('blocks.subscribe.periodicityDisplayOfferCards')}
          </Radio>
        </RadioGroup>

        <Hint>{t('blocks.subscribe.periodicityDisplayHint')}</Hint>
      </Content>
    </Panel>
  );
};
