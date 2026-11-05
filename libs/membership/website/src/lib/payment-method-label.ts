import { FullPaymentMethodFragment } from '@wepublish/website/api';
import { TFunction } from 'i18next';

/**
 * A payment method the way readers know it: by how they pay ("Rechnung",
 * "Karte oder TWINT"), not by the provider behind it. The labels are
 * translations per payment provider (`paymentMethodLabels`), which a tenant
 * can override; an unknown provider keeps the name from the editor.
 */
export const paymentMethodLabel = (
  t: TFunction,
  {
    paymentProviderID,
    name,
  }: Pick<FullPaymentMethodFragment, 'paymentProviderID' | 'name'>
): string =>
  t(`paymentMethodLabels.${paymentProviderID}`, { defaultValue: name });
