import styled from '@emotion/styled';
import {
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  Switch,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import { PaymentPeriodicity } from '@wepublish/editor/api';
import { fieldComponent, FormRow, useField } from '@wepublish/form/editor';
import {
  InfoTooltip,
  PAYMENT_PERIODICITY_MONTHS,
} from '@wepublish/ui/editor';
import { type FocusEvent, type ReactNode, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdPriceCheck } from 'react-icons/md';

import {
  enabledPeriodicitiesOf,
  materializePricing,
  type MemberPlanFormValues,
  type PeriodicityPrice,
} from './memberplan.schema';

type PriceWithoutPeriodicity = Omit<PeriodicityPrice, 'periodicity'>;

type PricingValue = MemberPlanFormValues['periodicityPricing'];

type StoredPrice = NonNullable<PricingValue>[number];

const Pricing = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(2)};
  min-width: 0;
`;

const DeriveRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const noPricing: PricingValue = [];

const hasPeriodicity = (price: StoredPrice): price is PeriodicityPrice =>
  price.periodicity != null;

const staysInside = (event: FocusEvent<HTMLElement>) =>
  event.relatedTarget instanceof Node &&
  event.currentTarget.contains(event.relatedTarget);

const amountText = (raw: string) => raw.match(/\d*[.,]?\d{0,2}/)?.[0] ?? '';

const centsFrom = (text: string): number | null => {
  const amount = Number(text.replace(',', '.'));

  return text === '' || Number.isNaN(amount) ? null : Math.round(amount * 100);
};

const textFrom = (cents: number | null) =>
  cents == null ? '' : (cents / 100).toFixed(2);

type AmountInputProps = {
  name: string;
  label: ReactNode;
  currency: string;
  centAmount: number | null;
  disabled: boolean;
  onChange: (centAmount: number | null) => void;
};

function AmountInput({
  name,
  label,
  currency,
  centAmount,
  disabled,
  onChange,
}: AmountInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <TextField
      name={name}
      label={label}
      value={draft ?? textFrom(centAmount)}
      disabled={disabled}
      onChange={event => setDraft(amountText(event.target.value))}
      onBlur={() => {
        if (draft !== null) {
          onChange(centsFrom(draft));
        }

        setDraft(null);
      }}
      slotProps={{
        inputLabel: { shrink: true },
        input: {
          endAdornment: (
            <InputAdornment position="end">{currency}</InputAdornment>
          ),
        },
        htmlInput: { inputMode: 'decimal' },
      }}
      fullWidth
    />
  );
}

function derivePeriodAmount(
  monthlyAmount: number | null | undefined,
  periodicity: PaymentPeriodicity
): number | null {
  if (monthlyAmount == null) {
    return null;
  }

  return Math.round(monthlyAmount * PAYMENT_PERIODICITY_MONTHS[periodicity]);
}

function formatDelta(delta: number, derived: number, currency: string): string {
  const percent = derived > 0 ? ((delta / derived) * 100).toFixed(1) : '0';
  const amount = (Math.abs(delta) / 100).toFixed(2);

  return `${delta >= 0 ? '−' : '+'} ${currency} ${amount} (${percent}%)`;
}

const isEmptyPrice = (price: PriceWithoutPeriodicity) =>
  price.label == null &&
  price.amountMin == null &&
  price.amountTarget == null &&
  price.amountMax == null;

function PricingEditor() {
  const { t } = useTranslation();
  const { ref, ...field } = useField<PricingValue>();
  const currency =
    useWatch<MemberPlanFormValues, 'currency'>({ name: 'currency' }) ?? 'CHF';
  const availablePaymentMethods = useWatch<
    MemberPlanFormValues,
    'availablePaymentMethods'
  >({ name: 'availablePaymentMethods' });
  const [activeTab, setActiveTab] = useState<PaymentPeriodicity | null>(null);

  const enabledPeriodicities = enabledPeriodicitiesOf(availablePaymentMethods);
  const monthlyEnabled = enabledPeriodicities.includes(
    PaymentPeriodicity.Monthly
  );
  const pricing = materializePricing(
    (field.value ?? noPricing).filter(hasPeriodicity),
    enabledPeriodicities
  );
  const helperTextId = `${field.id}-helper-text`;
  const errorId = `${field.id}-error`;

  if (!enabledPeriodicities.length) {
    return (
      <FormHelperText id={helperTextId}>
        {t('memberplanForm.periodicityPricingNoPeriodicities')}
      </FormHelperText>
    );
  }

  const periodicity =
    activeTab && enabledPeriodicities.includes(activeTab) ?
      activeTab
    : enabledPeriodicities[0];

  const setPeriodicityPrice = (price: PriceWithoutPeriodicity) => {
    const withoutPeriodicity = pricing.filter(
      entry => entry.periodicity !== periodicity
    );

    field.onChange(
      isEmptyPrice(price) ?
        withoutPeriodicity
      : [...withoutPeriodicity, { ...price, periodicity }]
    );
  };

  const isMonthlyTab = periodicity === PaymentPeriodicity.Monthly;
  const monthlyRow = pricing.find(
    price => price.periodicity === PaymentPeriodicity.Monthly
  );
  const monthlyPriced = monthlyRow?.amountMin != null;
  const override = pricing.find(price => price.periodicity === periodicity);
  const derivedMin = derivePeriodAmount(
    monthlyRow?.amountMin ?? 0,
    periodicity
  );
  const derivedTarget = derivePeriodAmount(
    monthlyRow?.amountTarget,
    periodicity
  );
  const derivedMax = derivePeriodAmount(monthlyRow?.amountMax, periodicity);
  const showDeriveToggle = !isMonthlyTab && monthlyEnabled && monthlyPriced;
  const hasOverride = override?.amountMin != null;
  const fieldsEditable = isMonthlyTab || !showDeriveToggle || hasOverride;
  const disabled = field.disabled || field.readOnly;
  const amountsDisabled = disabled || !fieldsEditable;
  const derived: PriceWithoutPeriodicity = {
    label: override?.label ?? null,
    amountMin: derivedMin ?? 0,
    amountTarget: derivedTarget,
    amountMax: derivedMax,
  };
  const overrideBase: PriceWithoutPeriodicity =
    override && hasOverride ?
      {
        label: override.label,
        amountMin: override.amountMin,
        amountTarget: override.amountTarget,
        amountMax: override.amountMax,
      }
    : derived;

  const shownMin = override?.amountMin ?? derivedMin ?? 0;
  const shownTarget =
    hasOverride ? (override?.amountTarget ?? null) : derivedTarget;
  const shownMax = hasOverride ? (override?.amountMax ?? null) : derivedMax;
  const targetInvalid =
    shownTarget != null &&
    (shownTarget < shownMin || (shownMax != null && shownTarget > shownMax));
  const maxInvalid = shownMax != null && shownMax < shownMin;

  const referenceDerived = derivedTarget ?? derivedMin;
  const referenceOverride =
    hasOverride ?
      (override?.amountTarget ?? override?.amountMin ?? null)
    : null;
  const delta =
    referenceDerived != null && referenceOverride != null ?
      referenceDerived - referenceOverride
    : null;
  const deltaText =
    delta != null && delta !== 0 && referenceDerived != null ?
      t('memberplanForm.periodicityPricingDelta', {
        delta: formatDelta(delta, referenceDerived, currency),
      })
    : null;

  const amountLabel = (monthly: string, period: string, help: string) => (
    <>
      {t(isMonthlyTab ? monthly : period)} <InfoTooltip text={t(help)} />
    </>
  );

  return (
    <Pricing
      role="group"
      aria-label={typeof field.label === 'string' ? field.label : undefined}
      aria-describedby={field.error ? errorId : helperTextId}
      ref={(element: HTMLDivElement | null) => {
        if (element) {
          ref({
            focus: () =>
              element.querySelector<HTMLElement>('[role="tab"]')?.focus(),
          });
        }
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!staysInside(event)) {
          field.onBlur();
        }
      }}
    >
      <FormHelperText id={helperTextId}>
        {t(
          monthlyEnabled ?
            'memberplanForm.periodicityPricingHelpText'
          : 'memberplanForm.periodicityPricingHelpTextNoMonthly'
        )}
      </FormHelperText>

      {field.error ?
        <FormHelperText
          id={errorId}
          error
        >
          {field.error}
        </FormHelperText>
      : null}

      <Tabs
        value={periodicity}
        variant="scrollable"
        allowScrollButtonsMobile
        onChange={(_event, eventKey: PaymentPeriodicity) =>
          setActiveTab(eventKey)
        }
      >
        {enabledPeriodicities.map(tabPeriodicity => (
          <Tab
            key={tabPeriodicity}
            value={tabPeriodicity}
            icon={
              (
                monthlyEnabled &&
                tabPeriodicity !== PaymentPeriodicity.Monthly &&
                pricing.some(
                  price =>
                    price.periodicity === tabPeriodicity &&
                    price.amountMin != null
                )
              ) ?
                <MdPriceCheck />
              : undefined
            }
            iconPosition="start"
            label={t(`memberPlanList.paymentPeriodicity.${tabPeriodicity}`)}
          />
        ))}
      </Tabs>

      {showDeriveToggle || deltaText !== null ?
        <DeriveRow>
          <FormHelperText>{deltaText}</FormHelperText>

          {showDeriveToggle ?
            <FormControlLabel
              control={
                <Switch
                  checked={hasOverride}
                  disabled={disabled}
                  onChange={(_event, enabled) =>
                    setPeriodicityPrice(
                      enabled ? derived : (
                        {
                          label: override?.label ?? null,
                          amountMin: null,
                          amountTarget: null,
                          amountMax: null,
                        }
                      )
                    )
                  }
                />
              }
              label={
                <>
                  {t('memberplanForm.periodicityPricingCustom')}{' '}
                  <InfoTooltip
                    text={t('memberplanForm.periodicityPricingCustomHelp')}
                  />
                </>
              }
            />
          : null}
        </DeriveRow>
      : null}

      <FormRow>
        <div>
          <AmountInput
            key={`${periodicity}-min`}
            name={`periodicityPricing.${periodicity}.amountMin`}
            label={amountLabel(
              'memberPlanEdit.amountPerMonthMin',
              'memberplanForm.periodicityPricingMin',
              'memberplanForm.periodicityPricingMinHelpText'
            )}
            currency={currency}
            centAmount={shownMin}
            disabled={amountsDisabled}
            onChange={centAmount =>
              setPeriodicityPrice({
                ...overrideBase,
                amountMin: Math.round(centAmount || 0),
              })
            }
          />
        </div>

        <div>
          <AmountInput
            key={`${periodicity}-target`}
            name={`periodicityPricing.${periodicity}.amountTarget`}
            label={amountLabel(
              'memberplanForm.amountPerMonthTarget',
              'memberplanForm.periodicityPricingTarget',
              'memberplanForm.periodicityPricingTargetHelpText'
            )}
            currency={currency}
            centAmount={shownTarget}
            disabled={amountsDisabled}
            onChange={centAmount =>
              setPeriodicityPrice({
                ...overrideBase,
                amountTarget:
                  centAmount != null ? Math.round(centAmount) : null,
              })
            }
          />
          {targetInvalid ?
            <FormHelperText error>
              {t('memberPlanEdit.targetPriceMustBeGreaterThanMin')}
            </FormHelperText>
          : null}
        </div>

        <div>
          <AmountInput
            key={`${periodicity}-max`}
            name={`periodicityPricing.${periodicity}.amountMax`}
            label={amountLabel(
              'memberPlanEdit.amountPerMonthMax',
              'memberplanForm.periodicityPricingMax',
              'memberplanForm.periodicityPricingMaxHelpText'
            )}
            currency={currency}
            centAmount={shownMax}
            disabled={amountsDisabled}
            onChange={centAmount =>
              setPeriodicityPrice({
                ...overrideBase,
                amountMax: centAmount != null ? Math.round(centAmount) : null,
              })
            }
          />
          {maxInvalid ?
            <FormHelperText error>
              {t('memberPlanEdit.maxPriceMustBeGreaterThanMin')}
            </FormHelperText>
          : null}
        </div>
      </FormRow>

      <TextField
        key={`${periodicity}-label`}
        name={`periodicityPricing.${periodicity}.label`}
        label={t('memberplanForm.periodicityPricingLabel')}
        helperText={t('memberplanForm.periodicityPricingLabelHelpText')}
        value={override?.label ?? ''}
        disabled={disabled}
        onChange={event =>
          setPeriodicityPrice({
            amountMin: override?.amountMin ?? null,
            amountTarget: override?.amountTarget ?? null,
            amountMax: override?.amountMax ?? null,
            label: event.target.value.trim() ? event.target.value : null,
          })
        }
        slotProps={{ htmlInput: { maxLength: 60 } }}
        fullWidth
      />
    </Pricing>
  );
}

export const MemberPlanPricingField =
  fieldComponent<PricingValue>()(PricingEditor);
