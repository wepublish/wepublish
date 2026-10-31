import {
  BuilderGoodiePickerProps,
  BuilderInvoiceListItemProps,
  BuilderInvoiceListProps,
  BuilderMemberPlanItemProps,
  BuilderMemberPlanPickerProps,
  BuilderPaymentAmountPickerProps,
  BuilderPaymentAmountSliderProps,
  BuilderPaymentMethodPickerProps,
  BuilderPeriodicityPickerProps,
  BuilderSubscribeProps,
  BuilderSubscriptionListItemProps,
  BuilderSubscriptionListProps,
  BuilderTransactionFeeProps,
  BuilderUpgradeProps,
} from './membership.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Subscribe = (props: BuilderSubscribeProps) => {
  const { Subscribe } = useWebsiteBuilder();

  return <Subscribe {...props} />;
};

export const Upgrade = (props: BuilderUpgradeProps) => {
  const { Upgrade } = useWebsiteBuilder();

  return <Upgrade {...props} />;
};

export const SubscriptionList = (props: BuilderSubscriptionListProps) => {
  const { SubscriptionList } = useWebsiteBuilder();

  return <SubscriptionList {...props} />;
};

export const SubscriptionListItem = (
  props: BuilderSubscriptionListItemProps
) => {
  const { SubscriptionListItem } = useWebsiteBuilder();

  return <SubscriptionListItem {...props} />;
};

export const InvoiceList = (props: BuilderInvoiceListProps) => {
  const { InvoiceList } = useWebsiteBuilder();

  return <InvoiceList {...props} />;
};

export const InvoiceListItem = (props: BuilderInvoiceListItemProps) => {
  const { InvoiceListItem } = useWebsiteBuilder();

  return <InvoiceListItem {...props} />;
};

export const GoodiePicker = (props: BuilderGoodiePickerProps) => {
  const { GoodiePicker } = useWebsiteBuilder();

  return <GoodiePicker {...props} />;
};

export const MemberPlanPicker = (props: BuilderMemberPlanPickerProps) => {
  const { MemberPlanPicker } = useWebsiteBuilder();

  return <MemberPlanPicker {...props} />;
};

export const MemberPlanItem = (props: BuilderMemberPlanItemProps) => {
  const { MemberPlanItem } = useWebsiteBuilder();

  return <MemberPlanItem {...props} />;
};

export const PaymentAmountSlider = (props: BuilderPaymentAmountSliderProps) => {
  const { PaymentAmountSlider } = useWebsiteBuilder();

  return <PaymentAmountSlider {...props} />;
};

export const PaymentAmountPicker = (props: BuilderPaymentAmountPickerProps) => {
  const { PaymentAmountPicker } = useWebsiteBuilder();

  return <PaymentAmountPicker {...props} />;
};

export const PaymentMethodPicker = (props: BuilderPaymentMethodPickerProps) => {
  const { PaymentMethodPicker } = useWebsiteBuilder();

  return <PaymentMethodPicker {...props} />;
};

export const PeriodicityPicker = (props: BuilderPeriodicityPickerProps) => {
  const { PeriodicityPicker } = useWebsiteBuilder();

  return <PeriodicityPicker {...props} />;
};

export const TransactionFee = (props: BuilderTransactionFeeProps) => {
  const { TransactionFee } = useWebsiteBuilder();

  return <TransactionFee {...props} />;
};
