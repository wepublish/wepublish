import { SubscribeBlockRenderLayout } from '@wepublish/website/api';
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

export const getAmountPickerValues = (
  layout: BuilderMemberPlanLayout | undefined
) => (layout && 'values' in layout ? layout.values : undefined);
