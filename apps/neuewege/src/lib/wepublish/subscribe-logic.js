// Subscribe-form logic of the we.publish website, ported 1:1 to plain JS so
// the clone's /abos form behaves like abos.neuewege.ch/mitmachen. Sources
// (monorepo): libs/membership/website/src/lib/formatters/format-payment-period.ts
// and libs/membership/website/src/lib/subscribe/{subscribe.tsx,
// member-plan-render-settings.ts}. Prices only come from the plan's
// `periodicityPricing` rows (we.publish #3037).

const MONTHS = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  yearly: 12,
  biennial: 24,
  lifetime: 1200,
};

// format-payment-period.ts `PERIODICITY_ORDER`
export const PERIODICITY_ORDER = [
  'monthly',
  'quarterly',
  'biannual',
  'yearly',
  'biennial',
  'lifetime',
];

export const periodicityMonths = periodicity => MONTHS[periodicity] ?? 12;

// format-payment-period.ts `calculatePeriodAmount`
export const calculatePeriodAmount = (monthlyAmount, periodicity) =>
  Math.round(monthlyAmount * periodicityMonths(periodicity));

// format-payment-period.ts `monthlyAmountFromPeriodAmount` — fractional on
// purpose: the API bills round(monthlyAmount × months), which reproduces the
// exact period price
export const monthlyAmountFromPeriodAmount = (periodAmount, periodicity) =>
  periodAmount / periodicityMonths(periodicity);

// format-payment-period.ts `getPlanPeriodicities`
export const getPlanPeriodicities = plan =>
  PERIODICITY_ORDER.filter(periodicity =>
    (plan?.availablePaymentMethods || []).some(apm =>
      apm.paymentPeriodicities.includes(periodicity)
    )
  );

// format-payment-period.ts `getDefaultPeriodicity`
export function getDefaultPeriodicity(plan) {
  const periodicities = getPlanPeriodicities(plan);
  if (
    plan?.defaultPaymentPeriodicity &&
    periodicities.includes(plan.defaultPaymentPeriodicity)
  ) {
    return plan.defaultPaymentPeriodicity;
  }
  return periodicities[0];
}

// format-payment-period.ts `getPeriodicityLabel`
export const getPeriodicityLabel = (plan, periodicity) =>
  plan?.periodicityPricing?.find(price => price.periodicity === periodicity)
    ?.label;

// format-payment-period.ts `getBasePriceRow`: the row other intervals are
// derived from — monthly if priced, else the cheapest per month (lifetime
// only as a last resort)
function getBasePriceRow(rows) {
  const monthly = rows.find(row => row.periodicity === 'monthly');
  if (monthly?.amountMin != null) return monthly;

  const priced = rows.filter(row => row.amountMin != null);
  const nonLifetime = priced.filter(row => row.periodicity !== 'lifetime');
  const perMonth = row => row.amountMin / periodicityMonths(row.periodicity);

  return (nonLifetime.length ? nonLifetime : priced).reduce(
    (cheapest, row) =>
      !cheapest || perMonth(row) < perMonth(cheapest) ? row : cheapest,
    undefined
  );
}

// format-payment-period.ts `getPeriodPriceRange`: the periodicity-pricing row
// of that interval; an interval without its own row is derived from the base row
export function getPeriodPriceRange(plan, periodicity) {
  const rows = plan.periodicityPricing ?? [];
  const row = rows.find(price => price.periodicity === periodicity);
  const base = getBasePriceRow(rows);
  const derive = amount =>
    amount == null || !base ?
      null
    : calculatePeriodAmount(
        monthlyAmountFromPeriodAmount(amount, base.periodicity),
        periodicity
      );

  return {
    amountMin: row?.amountMin ?? derive(base?.amountMin) ?? 0,
    amountTarget: row?.amountTarget ?? derive(base?.amountTarget),
    amountMax: row?.amountMax ?? derive(base?.amountMax),
  };
}

// member-plan-render-settings.ts
export const findRenderSetting = (renderSettings, planId) =>
  (renderSettings || []).find(setting => setting.memberPlanId === planId);
export const isFixedAmountLayout = layout => layout?.type === 'None';
export const isAmountPickerLayout = layout => layout?.type === 'Picker';
export const showsAmountInput = layout =>
  !!layout && 'showInput' in layout && !!layout.showInput;
export const getAmountPickerValues = layout =>
  layout && 'values' in layout ? layout.values : undefined;

// subscribe.tsx: the hide-amount rule
export function shouldHideAmount(layout, range) {
  if (layout) return isFixedAmountLayout(layout);
  return range.amountMin === range.amountMax;
}

// subscribe.tsx: the default plan (URL presets are not supported here)
export const getDefaultPlan = (plans, renderSettings) =>
  plans.find(
    plan =>
      plan.id === (renderSettings || []).find(s => s.isDefault)?.memberPlanId
  ) ?? plans[0];

// subscribe.tsx `allPaymentMethods`: the payment methods offered for the
// chosen interval, each with the forceAutoRenewal flag of its group
export function getPaymentMethods(plan, periodicity) {
  const methods = [];
  for (const apm of plan?.availablePaymentMethods || []) {
    if (!apm.paymentPeriodicities.includes(periodicity)) continue;
    for (const method of apm.paymentMethods) {
      if (!methods.some(m => m.id === method.id)) {
        methods.push({ ...method, forceAutoRenewal: apm.forceAutoRenewal });
      }
    }
  }
  return methods;
}

// subscribe.tsx `availableGoodies`: below goodieMinValue (a period amount)
// there are no goodies
export function getAvailableGoodies(plan, goodieMinValue, periodAmount) {
  if (goodieMinValue && goodieMinValue > periodAmount) return [];
  return plan?.goodies || [];
}

// subscribe.tsx `autoRenew`: forced by the payment method, impossible for
// plans that are not extendable, otherwise the visitor's choice
export function resolveAutoRenew(plan, paymentMethod, chosen) {
  if (!plan?.extendable) return false;
  if (paymentMethod?.forceAutoRenewal) return true;
  return chosen;
}
