import {
  PaymentPeriodicity,
  SubscribeBlockRenderLayout,
} from '@wepublish/website/api';
import { calculatePeriodAmount } from '../formatters/format-payment-period';
import {
  BuilderMemberPlanLayout,
  BuilderMemberPlanRenderSetting,
} from '@wepublish/website/builder';

export const findMemberPlanRenderSetting = (
  renderSettings: BuilderMemberPlanRenderSetting[] | undefined,
  memberPlanId: string | undefined
) =>
  memberPlanId ?
    renderSettings?.find(setting => setting.memberPlanId === memberPlanId)
  : undefined;

export const isAmountPickerLayout = (
  layout: BuilderMemberPlanLayout | undefined
) => layout?.type === SubscribeBlockRenderLayout.Picker;

export const isAmountSliderLayout = (
  layout: BuilderMemberPlanLayout | undefined
) => layout?.type === SubscribeBlockRenderLayout.Slider;

export const isFixedAmountLayout = (
  layout: BuilderMemberPlanLayout | undefined
) => layout?.type === SubscribeBlockRenderLayout.None;

export const showsAmountInput = (layout: BuilderMemberPlanLayout | undefined) =>
  !!layout && 'showInput' in layout && layout.showInput;

export const offersAmountChoice = (
  layout: BuilderMemberPlanLayout | undefined,
  periodicity?: PaymentPeriodicity
) => {
  if (!layout) {
    return true;
  }

  if (isAmountSliderLayout(layout)) {
    return true;
  }

  if (isAmountPickerLayout(layout)) {
    return (
      showsAmountInput(layout) ||
      getAmountPickerValues(layout, periodicity).length > 1
    );
  }

  return false;
};

export const getLowestSelectableAmount = (
  layout: BuilderMemberPlanLayout | undefined,
  periodicity: PaymentPeriodicity | undefined,
  priceRange: {
    amountMin: number;
    amountTarget?: number | null;
  }
) => {
  if (!layout || isAmountSliderLayout(layout) || showsAmountInput(layout)) {
    return priceRange.amountMin;
  }

  if (isAmountPickerLayout(layout)) {
    const tiles = getAmountPickerValues(layout, periodicity);
    const affordable = tiles.filter(tile => tile >= priceRange.amountMin);

    return Math.min(...(affordable.length ? affordable : tiles));
  }

  return priceRange.amountTarget ?? priceRange.amountMin;
};

const DEFAULT_MONTHLY_TILE_VALUES = [1000, 1500, 2000];

type PickerLayoutValues = {
  values?: number[] | null;
  valuesByPeriodicity?: Array<{
    periodicity: PaymentPeriodicity;
    values: number[];
  }> | null;
};

export const getAmountPickerValues = (
  layout: BuilderMemberPlanLayout | undefined,
  periodicity: PaymentPeriodicity = PaymentPeriodicity.Monthly
) => {
  const pickerLayout = layout as PickerLayoutValues | undefined;

  const perPeriodicity = pickerLayout?.valuesByPeriodicity?.find(
    entry => entry.periodicity === periodicity
  )?.values;

  if (perPeriodicity?.length) {
    return perPeriodicity;
  }

  const monthlyValues =
    pickerLayout?.values?.length ?
      pickerLayout.values
    : DEFAULT_MONTHLY_TILE_VALUES;

  return monthlyValues.map(value => calculatePeriodAmount(value, periodicity));
};
