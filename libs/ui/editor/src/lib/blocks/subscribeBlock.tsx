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
import styled from '@emotion/styled';
import {
  Alert,
  Autocomplete,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  MemberPlanListDocument,
  PaymentPeriodicity,
  ProductType,
  SubscribeBlockField,
  SubscribeBlockLayoutPickerConfig,
  SubscribeBlockRenderLayout,
  SubscribePeriodicityDisplay,
} from '@wepublish/editor/api';
import {
  Fragment,
  ReactNode,
  useCallback,
  useId,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdDragIndicator, MdPriceCheck } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import {
  BlockSection,
  BlockSectionHeader,
  BlockSections,
} from '../atoms/blockSection';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { InfoTooltip, InfoTrigger } from '../atoms/infoTooltip';
import {
  getPeriodPriceRange,
  getPlanPeriodicities,
  PlanForPeriodAmount,
} from '../memberPlan/periodicity-pricing';
import { ClickPopover } from '../popover';
import { PAYMENT_PERIODICITY_MONTHS } from '../utility';
import { SubscribeBlockValue } from './types';

const PlanList = styled('ul')`
  container-type: inline-size;
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

const PlanItem = styled('li')`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(1.5, 1)};
  padding: ${({ theme }) => theme.spacing(1.5, 2, 1.5, 1)};
  background-color: ${({ theme }) => theme.vars.palette.background.default};

  &:first-of-type {
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
  }

  &:last-of-type {
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
  }

  & + & {
    border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
  }

  &[data-dragging='true'] {
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
    background-color: ${({ theme }) => theme.vars.palette.background.paper};
    box-shadow: ${({ theme }) => theme.vars.shadows[6]};
  }

  @container (max-width: 480px) {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'handle summary default'
      'layout layout layout'
      'settings settings settings';
    padding: ${({ theme }) => theme.spacing(1, 1.5, 1.5, 0.5)};
  }
`;

const DragHandle = styled('div')`
  grid-row: span 2;
  align-self: start;

  @container (max-width: 480px) {
    grid-area: handle;
    align-self: center;
  }
`;

const PlanHeader = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  grid-template-areas: 'summary layout default';
  gap: ${({ theme }) => theme.spacing(1, 2)};
  align-items: center;
  min-height: 40px;

  @container (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'summary default'
      'layout layout';
  }

  @container (max-width: 480px) {
    display: contents;
  }
`;

const PlanSummary = styled('div')`
  grid-area: summary;
  display: grid;
  min-width: 0;
`;

const PlanPrice = styled('span')`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing(0.5)};
  align-items: center;
  min-width: 0;
`;

const PlanLayoutToggle = styled(ToggleButtonGroup)`
  grid-area: layout;

  .MuiToggleButton-root {
    padding-inline: ${({ theme }) => theme.spacing(1.5)};
    white-space: nowrap;
  }

  .MuiToggleButton-root:not(.Mui-selected, .Mui-disabled) {
    color: ${({ theme }) => theme.vars.palette.text.primary};
  }

  @container (max-width: 720px) {
    .MuiToggleButton-root {
      flex: 1 1 0;
      white-space: normal;
      line-height: 1.2;
    }
  }
`;

const PlanDefault = styled(FormControlLabel)`
  grid-area: default;
  margin: 0;
  white-space: nowrap;
`;

const PlanSettings = styled('div')`
  grid-column: 2;
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-items: start;

  &:empty {
    display: none;
  }

  & > * {
    justify-self: stretch;
  }

  & > .MuiFormControlLabel-root {
    justify-self: start;
  }

  @container (max-width: 480px) {
    grid-area: settings;
    padding-left: ${({ theme }) => theme.spacing(1)};
  }
`;

const PlanAmountsPopover = styled('div')`
  max-width: 320px;
  padding: ${({ theme }) => theme.spacing(1, 1.5)};
`;

const PlanAmountsBreakdown = styled('div')`
  display: grid;
  grid-template-columns: max-content max-content;
  gap: ${({ theme }) => theme.spacing(0.25, 1.5)};
  font-size: 12px;
`;

const InlineLabel = styled('span')`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing(0.5)};
  align-items: center;
`;

const DisplayOption = styled(FormControlLabel)`
  align-items: flex-start;
  margin-left: -9px;

  & + & {
    margin-top: ${({ theme }) => theme.spacing(1)};
  }

  .MuiRadio-root {
    margin-top: -6px;
  }
`;

const DisplayOptionText = styled('span')`
  display: grid;
  gap: 2px;
`;

const SubSettings = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(1)};
  padding-left: ${({ theme }) => theme.spacing(4)};
  justify-items: start;

  ${({ theme }) => theme.breakpoints.down('sm')} {
    padding-left: 0;
  }
`;

const GoodieMinValueRow = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1, 2)};
  align-items: center;
`;

const GoodieMinValueInput = styled(TextField)`
  width: 280px;
  max-width: 100%;
`;

const TAG_SEPARATOR = /[\s,]+/;

const isAmount = (token: string) => {
  const amount = Number(token);

  return token !== '' && Number.isFinite(amount) && amount > 0;
};

type AmountTagsInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
};

const AmountTagsInput = ({
  value,
  onChange,
  placeholder,
  helperText,
  disabled,
}: AmountTagsInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (nextInput: string) => {
    const tokens = nextInput.split(TAG_SEPARATOR);
    const rest = tokens.pop() ?? '';
    const amounts = tokens.filter(isAmount);

    if (amounts.length) {
      onChange([...value, ...amounts]);
    }

    setInputValue(rest);
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      autoSelect
      disabled={disabled}
      options={[]}
      value={value}
      inputValue={inputValue}
      onInputChange={(_event, nextInput, reason) =>
        reason === 'input' ? handleInputChange(nextInput) : setInputValue('')
      }
      onChange={(_event, tags) => onChange(tags.filter(isAmount))}
      renderInput={params => (
        <TextField
          {...params}
          placeholder={value.length ? undefined : placeholder}
          helperText={helperText}
        />
      )}
    />
  );
};

type SortablePlanRowProps = {
  id: string;
  label: string;
  disabled?: boolean;
  children: ReactNode;
};

const SortablePlanRow = ({
  id,
  label,
  disabled,
  children,
}: SortablePlanRowProps) => {
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
    <PlanItem
      ref={setNodeRef}
      aria-label={label}
      data-dragging={isDragging}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
        position: 'relative',
      }}
    >
      <DragHandle
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
      </DragHandle>

      {children}
    </PlanItem>
  );
};

const SUBSCRIBE_BLOCK_FIELDS = [
  SubscribeBlockField.FirstName,
  SubscribeBlockField.Birthday,
  SubscribeBlockField.Address,
  SubscribeBlockField.EmailRepeated,
  SubscribeBlockField.Password,
  SubscribeBlockField.PasswordRepeated,
];

export const renderLayouts: SubscribeBlockRenderLayout[] = [
  SubscribeBlockRenderLayout.None,
  SubscribeBlockRenderLayout.Slider,
  SubscribeBlockRenderLayout.Picker,
];

const DEFAULT_MONTHLY_TILE_VALUES = [1000, 1500, 2000];

const defaultAmountTileValues = (periodicity: PaymentPeriodicity) =>
  DEFAULT_MONTHLY_TILE_VALUES.map(
    value => value * PAYMENT_PERIODICITY_MONTHS[periodicity]
  );

const formatValues = (value: number[] | null | undefined) =>
  (value ?? []).map(tileValue =>
    tileValue % 100 === 0 ?
      String(tileValue / 100)
    : (tileValue / 100).toFixed(2)
  );

const formatPlanAmount = (amount: number | null | undefined) =>
  amount != null ? (amount / 100).toFixed(2) : '–';

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

const formatPlanPriceSummary = (
  plan: PlanForPeriodAmount | undefined,
  currency: string | null | undefined,
  periodicityLabel: (periodicity: PaymentPeriodicity) => string,
  targetLabel: (amount: string) => string,
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

  const range =
    amountMax != null && amountMax !== amountMin ?
      `${formatPlanAmount(amountMin)}–${formatPlanAmount(amountMax)}`
    : formatPlanAmount(amountMin);

  return [
    [currency, range].filter(Boolean).join(' '),
    periodicityLabel(periodicity),
    amountTarget != null ? targetLabel(formatPlanAmount(amountTarget)) : null,
  ]
    .filter(Boolean)
    .join(' · ');
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

  const defaultPlanRadioName = useId();

  const planLabel = (memberPlanId: string) =>
    memberPlanOptions.find(({ value: id }) => id === memberPlanId)?.label ??
    memberPlanId;

  return (
    <BlockSections>
      <BlockSection>
        <BlockSectionHeader title={t('blocks.subscribe.selectMemberPlans')} />

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
              helperText={t(
                'blocks.subscribe.selectMemberPlansSelectionHintAll'
              )}
            />
          )}
        />
      </BlockSection>

      {!!value.memberPlanRenderSettings.length && (
        <BlockSection>
          <BlockSectionHeader
            title={t('blocks.subscribe.renderStylesHeading')}
            description={t('blocks.subscribe.renderStylesHelp')}
          />

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
              <PlanList>
                {value.memberPlanRenderSettings.map(plan => {
                  const memberPlan = memberPlanById.get(plan.memberPlanId);
                  const layout =
                    plan.layout as Partial<SubscribeBlockLayoutPickerConfig>;

                  return (
                    <SortablePlanRow
                      key={plan.memberPlanId}
                      id={plan.memberPlanId}
                      label={planLabel(plan.memberPlanId)}
                      disabled={disabled}
                    >
                      <PlanHeader>
                        <PlanSummary>
                          <Typography
                            variant="subtitle2"
                            noWrap
                            title={planLabel(plan.memberPlanId)}
                          >
                            {planLabel(plan.memberPlanId)}
                          </Typography>

                          <PlanPrice>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatPlanPriceSummary(
                                memberPlan,
                                memberPlan?.currency,
                                periodicity =>
                                  t(
                                    `memberPlanList.paymentPeriodicity.${periodicity}`
                                  ),
                                amount =>
                                  t('blocks.subscribe.planAmountTarget', {
                                    amount,
                                  }),
                                usesMonthlyOnlyDisplay ?
                                  PaymentPeriodicity.Monthly
                                : undefined
                              )}
                            </Typography>

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
                                    memberPlan,
                                    memberPlan?.currency
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
                          </PlanPrice>
                        </PlanSummary>

                        <PlanLayoutToggle
                          exclusive
                          size="small"
                          color="primary"
                          disabled={disabled}
                          value={plan.layout.type}
                          aria-label={t('blocks.subscribe.amountLayout')}
                          onChange={(
                            _event,
                            layoutType: SubscribeBlockRenderLayout | null
                          ) =>
                            handlePlanLayoutChange(
                              plan.memberPlanId,
                              layoutType
                            )
                          }
                        >
                          {renderLayoutOptions.map(option => (
                            <ToggleButton
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </ToggleButton>
                          ))}
                        </PlanLayoutToggle>

                        <PlanDefault
                          control={
                            <Radio
                              size="small"
                              name={defaultPlanRadioName}
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
                            <InlineLabel>
                              <Typography variant="body2">
                                {t('blocks.subscribe.defaultPlanLabel')}
                              </Typography>
                              <InfoTooltip
                                text={t('blocks.subscribe.defaultPlanTitle')}
                              />
                            </InlineLabel>
                          }
                        />
                      </PlanHeader>

                      <PlanSettings>
                        {plan.layout.type ===
                          SubscribeBlockRenderLayout.None && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {t('blocks.subscribe.fixedAmountHint')}
                          </Typography>
                        )}

                        {plan.layout.type ===
                          SubscribeBlockRenderLayout.Picker &&
                          (() => {
                            const tilePeriodicities =
                              usesMonthlyOnlyDisplay ?
                                [PaymentPeriodicity.Monthly]
                              : getPlanPeriodicities(memberPlan ?? {});
                            const storedValues = layout.valuesByPeriodicity;
                            const activeTab =
                              tilePeriodicities.find(
                                periodicity =>
                                  periodicity ===
                                  activeTileTabs[plan.memberPlanId]
                              ) ?? tilePeriodicities[0];

                            return (
                              <div>
                                {tilePeriodicities.length > 1 && (
                                  <Tabs
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
                                  </Tabs>
                                )}

                                <AmountTagsInput
                                  disabled={disabled}
                                  value={formatValues(
                                    storedValues?.find(
                                      entry => entry.periodicity === activeTab
                                    )?.values
                                  )}
                                  onChange={tileValues =>
                                    handlePeriodicityAmountsChange(
                                      plan.memberPlanId,
                                      activeTab,
                                      tileValues
                                    )
                                  }
                                  placeholder={formatValues(
                                    defaultAmountTileValues(activeTab)
                                  ).join(' ')}
                                  helperText={t(
                                    usesMonthlyOnlyDisplay ?
                                      'blocks.subscribe.amountTileValues.hintMonthly'
                                    : 'blocks.subscribe.amountTileValues.hint'
                                  )}
                                />
                              </div>
                            );
                          })()}

                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={!!layout.showInput}
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
                            <InlineLabel>
                              <Typography variant="body2">
                                {t(
                                  (
                                    plan.layout.type ===
                                      SubscribeBlockRenderLayout.None
                                  ) ?
                                    'blocks.subscribe.showInCardAmountInput.label'
                                  : 'blocks.subscribe.showAmountInput.label'
                                )}
                              </Typography>
                              <InfoTooltip
                                text={t(
                                  (
                                    plan.layout.type ===
                                      SubscribeBlockRenderLayout.None
                                  ) ?
                                    'blocks.subscribe.showInCardAmountInput.title'
                                  : 'blocks.subscribe.showAmountInput.title'
                                )}
                              />
                            </InlineLabel>
                          }
                        />
                      </PlanSettings>
                    </SortablePlanRow>
                  );
                })}
              </PlanList>
            </SortableContext>
          </DndContext>
        </BlockSection>
      )}

      <BlockSection>
        <BlockSectionHeader title={t('blocks.subscribe.periodicityDisplay')} />

        <FormControl disabled={disabled}>
          <RadioGroup
            aria-label={t('blocks.subscribe.periodicityDisplay')}
            value={periodicityDisplay}
            onChange={(_event, nextPeriodicityDisplay) =>
              onChange(current => ({
                ...current,
                periodicityDisplay:
                  nextPeriodicityDisplay as SubscribePeriodicityDisplay,
              }))
            }
          >
            {(
              [
                [SubscribePeriodicityDisplay.Dropdown, 'Dropdown'],
                [SubscribePeriodicityDisplay.OfferCards, 'OfferCards'],
                [SubscribePeriodicityDisplay.Toggle, 'Toggle'],
              ] as const
            ).map(([display, key]) => (
              <DisplayOption
                key={display}
                value={display}
                control={<Radio />}
                label={
                  <DisplayOptionText>
                    <Typography variant="body2">
                      {t(`blocks.subscribe.periodicityDisplay${key}`)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {t(`blocks.subscribe.periodicityDisplay${key}Hint`)}
                    </Typography>
                  </DisplayOptionText>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>

        {usesMonthlyOnlyDisplay && !!plansWithIgnoredPricing.length && (
          <Alert severity="info">
            {t('blocks.subscribe.periodicityDisplayDropdownIgnoredRows', {
              count: plansWithIgnoredPricing.length,
              plans: plansWithIgnoredPricing.map(({ name }) => name).join(', '),
            })}
          </Alert>
        )}
      </BlockSection>

      <BlockSection>
        <BlockSectionHeader title={t('blocks.subscribe.goodiesHeading')} />

        <div>
          <FormControlLabel
            control={
              <Checkbox
                checked={value.showGoodies}
                disabled={disabled}
                onChange={(_event, checked) =>
                  handleShowGoodiesChange(undefined, checked)
                }
              />
            }
            label={
              <Typography variant="body2">
                {t('blocks.subscribe.showGoodies')}
              </Typography>
            }
          />

          <Collapse
            in={value.showGoodies}
            unmountOnExit
          >
            <SubSettings>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={value.hideRepeatGoodieOnUpgrade}
                    disabled={disabled}
                    onChange={handleHideRepeatGoodieOnUpgradeChange}
                  />
                }
                label={
                  <Typography variant="body2">
                    {t('blocks.subscribe.hideRepeatGoodieOnUpgrade')}
                  </Typography>
                }
              />

              <GoodieMinValueRow>
                <GoodieMinValueInput
                  type="number"
                  label={t('blocks.subscribe.goodieMinValue.label')}
                  disabled={disabled}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  value={
                    value.goodieMinValue != null ?
                      value.goodieMinValue / 100
                    : ''
                  }
                  onChange={event =>
                    handleGoodieMinValueChange(event.target.value)
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={value.goodieMinValueAppliesToUpgrade}
                      disabled={disabled || value.goodieMinValue == null}
                      onChange={handleGoodieMinValueAppliesToUpgradeChange}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {t('blocks.subscribe.goodieMinValueAppliesToUpgrade')}
                    </Typography>
                  }
                />
              </GoodieMinValueRow>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {t('blocks.subscribe.goodieMinValue.hint')}
              </Typography>
            </SubSettings>
          </Collapse>
        </div>
      </BlockSection>

      <BlockSection>
        <BlockSectionHeader
          title={t('blocks.subscribe.discountCodesHeading')}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={value.showDiscountCodes}
              disabled={disabled}
              onChange={(_event, checked) =>
                handleShowDiscountCodesChange(undefined, checked)
              }
            />
          }
          label={
            <Typography variant="body2">
              {t('blocks.subscribe.showDiscountCodes')}
            </Typography>
          }
        />
      </BlockSection>

      <BlockSection>
        <BlockSectionHeader title={t('blocks.subscribe.selectFields')} />

        <Autocomplete
          multiple
          disableCloseOnSelect
          disabled={disabled}
          options={SUBSCRIBE_BLOCK_FIELDS}
          getOptionLabel={field => t(`blocks.subscribe.${field}`)}
          value={value.fields}
          onChange={(_event, fields) => handleFieldsChange(fields)}
          renderInput={params => (
            <TextField
              {...params}
              helperText={t('blocks.subscribe.selectFieldsSelectionHint')}
            />
          )}
        />
      </BlockSection>
    </BlockSections>
  );
};
