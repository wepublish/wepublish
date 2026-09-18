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
  SubscribeBlockLayoutNoneConfig,
  SubscribeBlockLayoutSliderConfig,
  SubscribeBlockRenderLayout,
  SubscribePeriodicityDisplay,
  useMemberPlanListQuery,
} from '@wepublish/editor/api';
import { Fragment, ReactNode, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDragIndicator, MdInfo, MdPriceCheck } from 'react-icons/md';
import type { CheckPickerProps } from 'rsuite';
import {
  Checkbox,
  CheckPicker,
  IconButton,
  Nav,
  NumberInput,
  Panel as RPanel,
  Popover as RPopover,
  Radio,
  RadioGroup,
  SelectPicker,
  TagInput,
  Toggle,
  Whisper,
} from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { getMonthlyEquivalentRange } from '../utility';
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

const DisplayOptionRadio = styled(Radio)`
  --rs-radio-border: var(--rs-gray-600);

  .rs-radio-checker > label {
    align-items: start;
  }

  & + & {
    margin-top: 8px;
  }

  &[data-disabled='true']:not([data-checked='true']) .rs-radio-inner::before {
    border-color: var(--rs-gray-300);
    background-color: var(--rs-gray-100);
  }
`;

const RadioOption = styled('span')`
  display: grid;
  gap: 2px;
`;

const RadioOptionLabel = styled('span')`
  line-height: 1.4;
`;

const RadioOptionHint = styled('span')`
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: #6c757d;
`;

const RadioOptionWarning = styled(RadioOptionHint)`
  color: var(--rs-state-error);
`;

const RadioOptionNote = styled(RadioOptionHint)`
  color: var(--rs-state-info);
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
  grid-template-columns: minmax(0, max-content) 1fr max-content max-content;
  gap: 12px;
  align-items: center;
`;

const PlanDefaultToggle = styled(Toggle)`
  white-space: nowrap;
`;

const PlanStyleName = styled('span')`
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PlanAmounts = styled('span')`
  min-width: 150px;
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
`;

const TileTabs = styled(Nav)`
  margin-bottom: 12px;
`;

const TileValuesHint = styled(Hint)`
  margin-top: 6px;
`;

const PlanAmountsCell = styled('span')`
  display: inline-flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
`;

const PlanAmountsPopover = styled(RPopover)`
  max-width: 320px;
`;

const PlanAmountsBreakdown = styled('div')`
  display: grid;
  grid-template-columns: max-content max-content;
  gap: 2px 12px;
  font-size: 12px;
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

const DEFAULT_MONTHLY_TILE_VALUES = [1000, 1500, 2000];

const defaultAmountTileValues = (periodicity: PaymentPeriodicity) =>
  DEFAULT_MONTHLY_TILE_VALUES.map(
    value => value * PERIODICITY_MONTHS[periodicity]
  );

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

const offersMonthly = (plan: PlanForPeriodAmount) =>
  getPlanPeriodicities(plan).includes(PaymentPeriodicity.Monthly);

const hasNonMonthlyPricing = (plan: PlanForPeriodAmount) =>
  !!plan.periodicityPricing?.some(
    price =>
      price.periodicity !== PaymentPeriodicity.Monthly &&
      price.amountMin != null
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
  const row = plan.periodicityPricing?.find(
    price => price.periodicity === periodicity
  );
  const equivalent = getMonthlyEquivalentRange(plan.periodicityPricing);

  const derive = (amount: number | null | undefined) =>
    amount != null ? calculatePeriodAmount(amount, periodicity) : null;

  return {
    amountMin: row?.amountMin ?? derive(equivalent.amountPerMonthMin) ?? 0,
    amountTarget: row?.amountTarget ?? derive(equivalent.amountPerMonthTarget),
    amountMax: row?.amountMax ?? derive(equivalent.amountPerMonthMax),
  };
};

const formatPlanPeriodicityAmounts = (
  plan: PlanForPeriodAmount | undefined,
  currency: string | null | undefined,
  periodicityLabel: (periodicity: PaymentPeriodicity) => string,
  forcedPeriodicity?: PaymentPeriodicity
) => {
  if (!plan) {
    return '';
  }

  const periodicity = forcedPeriodicity ?? getDefaultPeriodicity(plan);
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

const getPlanPeriodicityBreakdown = (
  plan: PlanForPeriodAmount | undefined,
  currency: string | null | undefined
) => {
  if (!plan) {
    return [];
  }

  return getPlanPeriodicities(plan).map(periodicity => {
    const { amountMin, amountTarget, amountMax } = getPeriodPriceRange(
      plan,
      periodicity
    );
    const amounts = [amountMin, amountTarget, amountMax]
      .map(formatPlanAmount)
      .join(' / ');

    return {
      periodicity,
      amounts: [currency, amounts].filter(Boolean).join(' '),
    };
  });
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

  const displayedPlans = useMemo(() => {
    const allPlans = data?.memberPlans?.nodes ?? [];
    const selected = value.memberPlanIds
      .map(memberPlanId => memberPlanById.get(memberPlanId))
      .filter(plan => !!plan);

    return selected.length ? selected : allPlans;
  }, [data?.memberPlans?.nodes, memberPlanById, value.memberPlanIds]);

  const plansWithoutMonthly = useMemo(
    () => displayedPlans.filter(plan => !offersMonthly(plan)),
    [displayedPlans]
  );

  const plansWithIgnoredPricing = useMemo(
    () => displayedPlans.filter(hasNonMonthlyPricing),
    [displayedPlans]
  );

  const periodicityDisplay =
    value.periodicityDisplay ?? SubscribePeriodicityDisplay.Dropdown;
  const usesMonthlyOnlyDisplay =
    periodicityDisplay === SubscribePeriodicityDisplay.Dropdown;
  const monthlyOnlyDisplayUnavailable = plansWithoutMonthly.length > 0;

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

            const previousLayout =
              setting.layout as Partial<SubscribeBlockLayoutPickerConfig>;

            switch (layoutType) {
              case SubscribeBlockRenderLayout.Picker: {
                return {
                  ...setting,
                  layout: {
                    ...previousLayout,
                    type: layoutType,
                    showInput: previousLayout.showInput ?? true,
                    values: previousLayout.values ?? [],
                  },
                };
              }

              default: {
                return {
                  ...setting,
                  layout: {
                    ...previousLayout,
                    type: layoutType,
                  } as (typeof setting)['layout'],
                };
              }
            }
          }
        ),
      }));
    },
    [onChange]
  );

  const [activeTileTabs, setActiveTileTabs] = useState<
    Record<string, PaymentPeriodicity>
  >({});

  const handlePeriodicityAmountsChange = useCallback(
    (
      memberPlanId: string,
      periodicity: PaymentPeriodicity,
      tileValues: readonly string[]
    ) => {
      const values = Array.from(
        new Set(
          tileValues.map(value => parseFloat(value) * 100).sort((a, b) => a - b)
        ).values()
      );

      onChange(current => ({
        ...current,
        memberPlanRenderSettings: current.memberPlanRenderSettings.map(
          setting => {
            if (setting.memberPlanId !== memberPlanId) {
              return setting;
            }

            const layout = setting.layout as SubscribeBlockLayoutPickerConfig;
            const others = (layout.valuesByPeriodicity ?? []).filter(
              entry => entry.periodicity !== periodicity
            );

            return {
              ...setting,
              layout: {
                ...layout,
                valuesByPeriodicity:
                  values.length ? [...others, { periodicity, values }] : others,
              },
            };
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
                          <PlanStyleName
                            title={
                              memberPlanOptions.find(
                                ({ value: id }) => id === plan.memberPlanId
                              )?.label ?? plan.memberPlanId
                            }
                          >
                            {memberPlanOptions.find(
                              ({ value: id }) => id === plan.memberPlanId
                            )?.label ?? plan.memberPlanId}
                          </PlanStyleName>

                          <PlanAmountsCell>
                            <PlanAmounts>
                              {formatPlanPeriodicityAmounts(
                                memberPlanById.get(plan.memberPlanId),
                                memberPlanById.get(plan.memberPlanId)?.currency,
                                periodicity =>
                                  t(
                                    `memberPlanList.paymentPeriodicity.${periodicity}`
                                  ),
                                usesMonthlyOnlyDisplay ?
                                  PaymentPeriodicity.Monthly
                                : undefined
                              )}
                            </PlanAmounts>

                            <Whisper
                              trigger={['hover', 'focus']}
                              placement="top"
                              speaker={
                                <PlanAmountsPopover
                                  title={t('blocks.subscribe.planAmountsTitle')}
                                >
                                  <PlanAmountsBreakdown>
                                    {getPlanPeriodicityBreakdown(
                                      memberPlanById.get(plan.memberPlanId),
                                      memberPlanById.get(plan.memberPlanId)
                                        ?.currency
                                    ).map(({ periodicity, amounts }) => (
                                      <Fragment key={periodicity}>
                                        <span>
                                          {t(
                                            `memberPlanList.paymentPeriodicity.${periodicity}`
                                          )}
                                        </span>
                                        <span>{amounts}</span>
                                      </Fragment>
                                    ))}
                                  </PlanAmountsBreakdown>
                                </PlanAmountsPopover>
                              }
                            >
                              <IconButton
                                icon={<MdInfo size={16} />}
                                circle
                                size="xs"
                                appearance="subtle"
                                aria-label={t(
                                  'blocks.subscribe.planAmountsTitle'
                                )}
                              />
                            </Whisper>
                          </PlanAmountsCell>

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
                          SubscribeBlockRenderLayout.None && (
                          <PickerSettings>
                            <Hint>{t('blocks.subscribe.fixedAmountHint')}</Hint>

                            <div>
                              <Checkbox
                                checked={
                                  (
                                    plan.layout as SubscribeBlockLayoutNoneConfig
                                  ).showInput
                                }
                                disabled={disabled}
                                title={t(
                                  'blocks.subscribe.showInCardAmountInput.title'
                                )}
                                onChange={(_value, checked) =>
                                  handleShowAmountInputChange(
                                    plan.memberPlanId,
                                    checked
                                  )
                                }
                              >
                                <Hint>
                                  {t(
                                    'blocks.subscribe.showInCardAmountInput.label'
                                  )}
                                </Hint>
                              </Checkbox>
                            </div>
                          </PickerSettings>
                        )}

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
                              {(() => {
                                const tilePeriodicities =
                                  usesMonthlyOnlyDisplay ?
                                    [PaymentPeriodicity.Monthly]
                                  : getPlanPeriodicities(
                                      memberPlanById.get(plan.memberPlanId) ??
                                        {}
                                    );
                                const storedValues = (
                                  plan.layout as SubscribeBlockLayoutPickerConfig
                                ).valuesByPeriodicity;
                                const activeTab =
                                  tilePeriodicities.find(
                                    periodicity =>
                                      periodicity ===
                                      activeTileTabs[plan.memberPlanId]
                                  ) ?? tilePeriodicities[0];

                                return (
                                  <>
                                    <TileTabs
                                      appearance="subtle"
                                      activeKey={activeTab}
                                      onSelect={eventKey =>
                                        setActiveTileTabs(current => ({
                                          ...current,
                                          [plan.memberPlanId]:
                                            eventKey as PaymentPeriodicity,
                                        }))
                                      }
                                    >
                                      {tilePeriodicities.map(periodicity => (
                                        <Nav.Item
                                          key={periodicity}
                                          eventKey={periodicity}
                                          icon={
                                            (
                                              storedValues?.some(
                                                entry =>
                                                  entry.periodicity ===
                                                    periodicity &&
                                                  entry.values.length
                                              )
                                            ) ?
                                              <MdPriceCheck />
                                            : undefined
                                          }
                                        >
                                          {t(
                                            `memberPlanList.paymentPeriodicity.${periodicity}`
                                          )}
                                        </Nav.Item>
                                      ))}
                                    </TileTabs>

                                    <TagInput
                                      disabled={disabled}
                                      trigger={['Enter', 'Space', 'Comma']}
                                      placeholder={formatValues(
                                        defaultAmountTileValues(activeTab)
                                      ).join(' ')}
                                      value={formatValues(
                                        storedValues?.find(
                                          entry =>
                                            entry.periodicity === activeTab
                                        )?.values
                                      )}
                                      onChange={tileValues =>
                                        handlePeriodicityAmountsChange(
                                          plan.memberPlanId,
                                          activeTab,
                                          tileValues
                                        )
                                      }
                                    />

                                    <TileValuesHint>
                                      {t(
                                        usesMonthlyOnlyDisplay ?
                                          'blocks.subscribe.amountTileValues.hintMonthly'
                                        : 'blocks.subscribe.amountTileValues.hint'
                                      )}
                                    </TileValuesHint>
                                  </>
                                );
                              })()}
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
        <Heading>{t('blocks.subscribe.periodicityDisplay')}</Heading>

        <RadioGroup
          disabled={disabled}
          value={periodicityDisplay}
          onChange={nextPeriodicityDisplay =>
            onChange(current => ({
              ...current,
              periodicityDisplay:
                nextPeriodicityDisplay as SubscribePeriodicityDisplay,
            }))
          }
        >
          <DisplayOptionRadio
            value={SubscribePeriodicityDisplay.Dropdown}
            disabled={disabled || monthlyOnlyDisplayUnavailable}
          >
            <RadioOption>
              <RadioOptionLabel>
                {t('blocks.subscribe.periodicityDisplayDropdown')}
              </RadioOptionLabel>
              <RadioOptionHint>
                {t('blocks.subscribe.periodicityDisplayDropdownHint')}
              </RadioOptionHint>

              {monthlyOnlyDisplayUnavailable && (
                <RadioOptionWarning>
                  {t('blocks.subscribe.periodicityDisplayDropdownUnavailable', {
                    count: plansWithoutMonthly.length,
                    plans: plansWithoutMonthly
                      .map(({ name }) => name)
                      .join(', '),
                  })}
                </RadioOptionWarning>
              )}

              {usesMonthlyOnlyDisplay && !!plansWithIgnoredPricing.length && (
                <RadioOptionNote>
                  {t('blocks.subscribe.periodicityDisplayDropdownIgnoredRows', {
                    count: plansWithIgnoredPricing.length,
                    plans: plansWithIgnoredPricing
                      .map(({ name }) => name)
                      .join(', '),
                  })}
                </RadioOptionNote>
              )}
            </RadioOption>
          </DisplayOptionRadio>

          <DisplayOptionRadio value={SubscribePeriodicityDisplay.OfferCards}>
            <RadioOption>
              <RadioOptionLabel>
                {t('blocks.subscribe.periodicityDisplayOfferCards')}
              </RadioOptionLabel>
              <RadioOptionHint>
                {t('blocks.subscribe.periodicityDisplayOfferCardsHint')}
              </RadioOptionHint>
            </RadioOption>
          </DisplayOptionRadio>

          <DisplayOptionRadio value={SubscribePeriodicityDisplay.Toggle}>
            <RadioOption>
              <RadioOptionLabel>
                {t('blocks.subscribe.periodicityDisplayToggle')}
              </RadioOptionLabel>
              <RadioOptionHint>
                {t('blocks.subscribe.periodicityDisplayToggleHint')}
              </RadioOptionHint>
            </RadioOption>
          </DisplayOptionRadio>
        </RadioGroup>
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
    </Panel>
  );
};
