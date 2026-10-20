import { useQuery } from '@apollo/client/react';
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
  Autocomplete,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  MemberPlanListDocument,
  PaymentPeriodicity,
  ProductType,
  SubscribeBlockField,
  SubscribeBlockLayoutNoneConfig,
  SubscribeBlockLayoutPickerConfig,
  SubscribeBlockLayoutSliderConfig,
  SubscribeBlockRenderLayout,
  SubscribePeriodicityDisplay,
} from '@wepublish/editor/api';
import { Fragment, ReactNode, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDragIndicator, MdPriceCheck } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { InfoTooltip, InfoTrigger } from '../atoms/infoTooltip';
import { ClickPopover } from '../popover';
import { getMonthlyEquivalentRange } from '../utility';
import { SubscribeBlockValue } from './types';

const Panel = styled(Card)`
  display: grid;
  padding: 0;
  overflow: hidden;
  background-color: ${({ theme }) => theme.vars.palette.background.default};

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
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const DisplayOptionRadio = styled(FormControlLabel)`
  --rs-radio-border: ${({ theme }) => theme.vars.palette.grey[600]};

  .rs-radio-checker > label {
    align-items: start;
  }

  & + & {
    margin-top: 8px;
  }

  &[data-disabled='true']:not([data-checked='true']) .rs-radio-inner::before {
    border-color: ${({ theme }) => theme.vars.palette.grey[300]};
    background-color: ${({ theme }) => theme.vars.palette.grey[100]};
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
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const RadioOptionNote = styled(RadioOptionHint)`
  color: ${({ theme }) => theme.vars.palette.info.main};
`;

const SettingLabel = styled('span', {
  shouldForwardProp: prop => prop !== 'deactivated',
})<{ deactivated?: boolean }>`
  font-size: 14px;

  ${({ deactivated, theme }) =>
    deactivated &&
    css`
      color: ${theme.vars.palette.text.disabled};
    `}
`;

const SUBSCRIBE_BLOCK_FIELDS = [
  SubscribeBlockField.FirstName,
  SubscribeBlockField.Birthday,
  SubscribeBlockField.Address,
  SubscribeBlockField.EmailRepeated,
  SubscribeBlockField.Password,
  SubscribeBlockField.PasswordRepeated,
];

const GoodieMinValueInput = styled(TextField)`
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

const SmallCheckbox = styled(FormControlLabel)`
  margin-left: 0;

  .MuiFormControlLabel-label {
    font-size: 12px;
    line-height: 1.4;
  }

  .MuiCheckbox-root {
    padding: 4px;
    transform: scale(0.85);
  }
`;

const PlanStyleRow = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, max-content) 1fr max-content max-content;
  gap: 12px;
  align-items: center;
`;

const PlanDefaultToggle = styled(Switch)`
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
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  white-space: nowrap;
`;

const TileTabs = styled(Tabs)`
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

const PlanAmountsPopover = styled('div')`
  max-width: 320px;
  padding: 8px 12px;
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
  background: ${({ theme }) => theme.vars.palette.background.paper};
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
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
  const { t } = useTranslation();
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
        <IconButtonTooltip caption={t('blocks.subscribe.dragToReorder')}>
          <IconButton
            aria-label={t('blocks.subscribe.dragToReorder')}
            disabled={disabled}
          >
            <MdDragIndicator />
          </IconButton>
        </IconButtonTooltip>
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

  const { data, loading } = useQuery(MemberPlanListDocument, {
    variables: {
      take: 200,
      filter: {
        active: true,
      },
    },
  });

  const productTypeLabels = useMemo(
    () => ({
      [ProductType.Subscription]: t('memberplanForm.productTypeSubscription'),
      [ProductType.Donation]: t('memberplanForm.productTypeDonation'),
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

  const plansWithIgnoredPricing = useMemo(
    () => displayedPlans.filter(hasNonMonthlyPricing),
    [displayedPlans]
  );

  const periodicityDisplay =
    value.periodicityDisplay ?? SubscribePeriodicityDisplay.Dropdown;
  const usesMonthlyOnlyDisplay =
    periodicityDisplay === SubscribePeriodicityDisplay.Dropdown;

  const handleMemberPlansChange = useCallback(
    (memberPlanIds: string[]) => {
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
                  __typename: 'SubscribeBlockMemberPlanRenderSetting',
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
      tileValues: string[]
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
    (memberPlanId: string, tileValues: string[]) => {
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

  const handleFieldsChange = useCallback(
    (fields: string[]) => {
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
    (_event: unknown, checked: boolean) => {
      onChange(current => ({ ...current, hideRepeatGoodieOnUpgrade: checked }));
    },
    [onChange]
  );

  const handleGoodieMinValueAppliesToUpgradeChange = useCallback(
    (_event: unknown, checked: boolean) => {
      onChange(current => ({
        ...current,
        goodieMinValueAppliesToUpgrade: checked,
      }));
    },
    [onChange]
  );

  return (
    <Panel variant="outlined">
      <CardContent>
        <Content>
          <Heading>{t('blocks.subscribe.selectMemberPlans')}</Heading>

          <Autocomplete
            multiple
            disableCloseOnSelect
            disabled={disabled}
            loading={loading}
            options={memberPlanOptions.map(option => option.value)}
            groupBy={id =>
              memberPlanOptions.find(option => option.value === id)?.group ?? ''
            }
            getOptionLabel={id =>
              memberPlanOptions.find(option => option.value === id)?.label ?? id
            }
            value={value.memberPlanIds}
            onChange={(_event, memberPlanIds) =>
              handleMemberPlansChange(memberPlanIds)
            }
            renderInput={params => (
              <TextField
                {...params}
                placeholder={t('blocks.subscribe.selectMemberPlansPlaceholder')}
              />
            )}
          />

          {!!value.memberPlanIds.length && (
            <Hint>
              {t('blocks.subscribe.selectMemberPlansSelectionHintAll')}
            </Hint>
          )}

          {!!value.memberPlanRenderSettings.length && (
            <>
              <Heading>
                {t('blocks.subscribe.renderStylesHeading')}{' '}
                <InfoTooltip text={t('blocks.subscribe.renderStylesHelp')} />
              </Heading>

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
                                  memberPlanById.get(plan.memberPlanId)
                                    ?.currency,
                                  periodicity =>
                                    t(
                                      `memberPlanList.paymentPeriodicity.${periodicity}`
                                    ),
                                  usesMonthlyOnlyDisplay ?
                                    PaymentPeriodicity.Monthly
                                  : undefined
                                )}
                              </PlanAmounts>

                              <ClickPopover
                                trigger={
                                  <InfoTrigger
                                    aria-label={t(
                                      'blocks.subscribe.planAmountsTitle'
                                    )}
                                  />
                                }
                                anchorOrigin={{
                                  vertical: 'top',
                                  horizontal: 'center',
                                }}
                                transformOrigin={{
                                  vertical: 'bottom',
                                  horizontal: 'center',
                                }}
                              >
                                <PlanAmountsPopover>
                                  <Typography variant="subtitle2">
                                    {t('blocks.subscribe.planAmountsTitle')}
                                  </Typography>

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
                              </ClickPopover>
                            </PlanAmountsCell>

                            <Autocomplete
                              options={renderLayoutOptions}
                              getOptionLabel={option => option.label}
                              isOptionEqualToValue={(option, selected) =>
                                option.value === selected.value
                              }
                              value={
                                renderLayoutOptions.find(
                                  option => option.value === plan.layout.type
                                ) ?? undefined
                              }
                              onChange={(_event, option) => {
                                const renderLayout = option.value;
                                handlePlanLayoutChange(
                                  plan.memberPlanId,
                                  renderLayout
                                );
                              }}
                              disableClearable
                              disabled={disabled}
                              renderInput={params => <TextField {...params} />}
                            />

                            <FormControlLabel
                              control={
                                <PlanDefaultToggle
                                  checked={!!plan.isDefault}
                                  disabled={disabled}
                                  onChange={(_event, checked) =>
                                    handlePlanDefaultChange(
                                      plan.memberPlanId,
                                      checked
                                    )
                                  }
                                />
                              }
                              label={
                                <>
                                  {t('blocks.subscribe.defaultPlanLabel')}{' '}
                                  <InfoTooltip
                                    text={t(
                                      'blocks.subscribe.defaultPlanTitle'
                                    )}
                                  />
                                </>
                              }
                            />
                          </PlanStyleRow>

                          {plan.layout.type ===
                            SubscribeBlockRenderLayout.None && (
                            <PickerSettings>
                              <Hint>
                                {t('blocks.subscribe.fixedAmountHint')}
                              </Hint>

                              <div>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={
                                        (
                                          plan.layout as SubscribeBlockLayoutNoneConfig
                                        ).showInput
                                      }
                                      disabled={disabled}
                                      onChange={(_event, checked) =>
                                        handleShowAmountInputChange(
                                          plan.memberPlanId,
                                          checked
                                        )
                                      }
                                    />
                                  }
                                  label={
                                    <Hint>
                                      {t(
                                        'blocks.subscribe.showInCardAmountInput.label'
                                      )}{' '}
                                      <InfoTooltip
                                        text={t(
                                          'blocks.subscribe.showInCardAmountInput.title'
                                        )}
                                      />
                                    </Hint>
                                  }
                                />
                              </div>
                            </PickerSettings>
                          )}

                          {plan.layout.type ===
                            SubscribeBlockRenderLayout.Slider && (
                            <PickerSettings>
                              <div>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={
                                        (
                                          plan.layout as SubscribeBlockLayoutSliderConfig
                                        ).showInput
                                      }
                                      disabled={disabled}
                                      onChange={(_event, checked) =>
                                        handleShowAmountInputChange(
                                          plan.memberPlanId,
                                          checked
                                        )
                                      }
                                    />
                                  }
                                  label={
                                    <Hint>
                                      {t(
                                        'blocks.subscribe.showAmountInput.label'
                                      )}{' '}
                                      <InfoTooltip
                                        text={t(
                                          'blocks.subscribe.showAmountInput.title'
                                        )}
                                      />
                                    </Hint>
                                  }
                                />
                              </div>
                            </PickerSettings>
                          )}

                          {plan.layout.type ===
                            SubscribeBlockRenderLayout.Picker && (
                            <PickerSettings>
                              <div>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={
                                        (
                                          plan.layout as SubscribeBlockLayoutPickerConfig
                                        ).showInput
                                      }
                                      disabled={disabled}
                                      onChange={(_event, checked) =>
                                        handleShowAmountInputChange(
                                          plan.memberPlanId,
                                          checked
                                        )
                                      }
                                    />
                                  }
                                  label={
                                    <Hint>
                                      {t(
                                        'blocks.subscribe.showAmountInput.label'
                                      )}{' '}
                                      <InfoTooltip
                                        text={t(
                                          'blocks.subscribe.showAmountInput.title'
                                        )}
                                      />
                                    </Hint>
                                  }
                                />
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
                                        value={activeTab}
                                        variant="scrollable"
                                        onChange={(_event, eventKey) =>
                                          setActiveTileTabs(current => ({
                                            ...current,
                                            [plan.memberPlanId]:
                                              eventKey as PaymentPeriodicity,
                                          }))
                                        }
                                      >
                                        {tilePeriodicities.map(periodicity => (
                                          <Tab
                                            key={periodicity}
                                            value={periodicity}
                                            iconPosition="start"
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
                                            label={t(
                                              `memberPlanList.paymentPeriodicity.${periodicity}`
                                            )}
                                          />
                                        ))}
                                      </TileTabs>

                                      <Autocomplete
                                        multiple
                                        freeSolo
                                        disabled={disabled}
                                        options={[]}
                                        value={formatValues(
                                          storedValues?.find(
                                            entry =>
                                              entry.periodicity === activeTab
                                          )?.values
                                        )}
                                        onChange={(_event, tileValues) =>
                                          handlePeriodicityAmountsChange(
                                            plan.memberPlanId,
                                            activeTab,
                                            tileValues
                                          )
                                        }
                                        renderInput={params => (
                                          <TextField
                                            {...params}
                                            placeholder={formatValues(
                                              defaultAmountTileValues(activeTab)
                                            ).join(' ')}
                                          />
                                        )}
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

          <FormControl disabled={disabled}>
            <RadioGroup
              value={periodicityDisplay}
              onChange={(_event, nextPeriodicityDisplay) =>
                onChange(current => ({
                  ...current,
                  periodicityDisplay:
                    nextPeriodicityDisplay as SubscribePeriodicityDisplay,
                }))
              }
            >
              <DisplayOptionRadio
                value={SubscribePeriodicityDisplay.Dropdown}
                control={<Radio />}
                label={
                  <RadioOption>
                    <RadioOptionLabel>
                      {t('blocks.subscribe.periodicityDisplayDropdown')}
                    </RadioOptionLabel>
                    <RadioOptionHint>
                      {t('blocks.subscribe.periodicityDisplayDropdownHint')}
                    </RadioOptionHint>

                    {usesMonthlyOnlyDisplay &&
                      !!plansWithIgnoredPricing.length && (
                        <RadioOptionNote>
                          {t(
                            'blocks.subscribe.periodicityDisplayDropdownIgnoredRows',
                            {
                              count: plansWithIgnoredPricing.length,
                              plans: plansWithIgnoredPricing
                                .map(({ name }) => name)
                                .join(', '),
                            }
                          )}
                        </RadioOptionNote>
                      )}
                  </RadioOption>
                }
              />

              <DisplayOptionRadio
                value={SubscribePeriodicityDisplay.OfferCards}
                control={<Radio />}
                label={
                  <RadioOption>
                    <RadioOptionLabel>
                      {t('blocks.subscribe.periodicityDisplayOfferCards')}
                    </RadioOptionLabel>
                    <RadioOptionHint>
                      {t('blocks.subscribe.periodicityDisplayOfferCardsHint')}
                    </RadioOptionHint>
                  </RadioOption>
                }
              />

              <DisplayOptionRadio
                value={SubscribePeriodicityDisplay.Toggle}
                control={<Radio />}
                label={
                  <RadioOption>
                    <RadioOptionLabel>
                      {t('blocks.subscribe.periodicityDisplayToggle')}
                    </RadioOptionLabel>
                    <RadioOptionHint>
                      {t('blocks.subscribe.periodicityDisplayToggleHint')}
                    </RadioOptionHint>
                  </RadioOption>
                }
              />
            </RadioGroup>
          </FormControl>
        </Content>

        <Content>
          <Heading>{t('blocks.subscribe.goodiesHeading')}</Heading>

          <GoodiesToggleRow>
            <Switch
              checked={value.showGoodies}
              disabled={disabled}
              onChange={(_event, checked) =>
                handleShowGoodiesChange(undefined, checked)
              }
            />

            <SmallCheckbox
              control={
                <Checkbox
                  checked={value.hideRepeatGoodieOnUpgrade}
                  disabled={disabled || !value.showGoodies}
                  onChange={handleHideRepeatGoodieOnUpgradeChange}
                />
              }
              label={t('blocks.subscribe.hideRepeatGoodieOnUpgrade')}
            />
          </GoodiesToggleRow>

          <div>
            <SettingLabel deactivated={disabled || !value.showGoodies}>
              {t('blocks.subscribe.goodieMinValue.label')}
            </SettingLabel>

            <GoodieMinValueRow>
              <GoodieMinValueInput
                type="number"
                disabled={disabled || !value.showGoodies}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                value={
                  value.goodieMinValue != null ? value.goodieMinValue / 100 : ''
                }
                onChange={event =>
                  handleGoodieMinValueChange(event.target.value)
                }
              />

              <SmallCheckbox
                control={
                  <Checkbox
                    checked={value.goodieMinValueAppliesToUpgrade}
                    disabled={
                      disabled ||
                      !value.showGoodies ||
                      value.goodieMinValue == null
                    }
                    onChange={handleGoodieMinValueAppliesToUpgradeChange}
                  />
                }
                label={t('blocks.subscribe.goodieMinValueAppliesToUpgrade')}
              />
            </GoodieMinValueRow>
          </div>
        </Content>

        <Content>
          <Heading>{t('blocks.subscribe.discountCodesHeading')}</Heading>

          <Switch
            checked={value.showDiscountCodes}
            disabled={disabled}
            onChange={(_event, checked) =>
              handleShowDiscountCodesChange(undefined, checked)
            }
          />
        </Content>

        <Content>
          <Heading>{t('blocks.subscribe.selectFields')}</Heading>

          <Autocomplete
            multiple
            disableCloseOnSelect
            disabled={disabled}
            options={SUBSCRIBE_BLOCK_FIELDS}
            getOptionLabel={field => t(`blocks.subscribe.${field}`)}
            value={value.fields}
            onChange={(_event, fields) => handleFieldsChange(fields)}
            renderInput={params => <TextField {...params} />}
          />

          <Hint>{t('blocks.subscribe.selectFieldsSelectionHint')}</Hint>
        </Content>
      </CardContent>
    </Panel>
  );
};
