import { useMutation } from '@apollo/client/react';
import {
  CreatePaymentProviderSettingDocument,
  DeletePaymentProviderSettingDocument,
  getSettings,
  PaymentProviderSettingsDocument,
  PaymentProviderType,
  UpdatePaymentProviderSettingDocument,
} from '@wepublish/editor/api';
import {
  FormDrawerPanel,
  useEditForm,
  useQueryLoader,
} from '@wepublish/form/editor';
import { CanUpdatePaymentProviderSettings } from '@wepublish/permissions';

import bexioLogo from './assets/bexio.webp';
import mollieLogo from './assets/mollie.webp';
import payrexxLogo from './assets/payrexx.webp';
import stripeLogo from './assets/stripe.svg';
import { findSetting, settingName } from './integrationPaths';
import { IntegrationSettings } from './integrationSettings';
import {
  type PaymentSetting,
  fromPaymentSetting,
  toPaymentSettingVariables,
} from './paymentIntegration.schema';
import { paymentSettingView } from './paymentIntegration.view';
import { secretPlaceholder } from './secretPlaceholder';

export const creatablePaymentProviderTypes = (appEnvironment?: string) =>
  Object.values(PaymentProviderType).filter(
    type =>
      type !== PaymentProviderType.Simulated ||
      (!!appEnvironment && appEnvironment !== 'production')
  );

const writePermissions = [CanUpdatePaymentProviderSettings.id];

const paymentLogo = (setting: PaymentSetting) => {
  switch (setting.type) {
    case PaymentProviderType.Bexio:
      return bexioLogo;
    case PaymentProviderType.Mollie:
      return mollieLogo;
    case PaymentProviderType.Payrexx:
    case PaymentProviderType.PayrexxSubscription:
      return payrexxLogo;
    case PaymentProviderType.Stripe:
    case PaymentProviderType.StripeCheckout:
      return stripeLogo;
    default:
      return undefined;
  }
};

export function PaymentSettingForm({ setting }: { setting: PaymentSetting }) {
  const load = useQueryLoader(PaymentProviderSettingsDocument, {}, data =>
    fromPaymentSetting(findSetting(data.paymentProviderSettings, setting.id))
  );
  const [updateSetting] = useMutation(UpdatePaymentProviderSettingDocument);
  const controller = useEditForm(paymentSettingView, {
    title: 'integrations.editSetting',
    titleParams: () => ({ name: settingName(setting) }),
    writePermissions,
    fields: {
      apiKey: { placeholder: secretPlaceholder(setting.isApiKeySet) },
      webhookEndpointSecret: {
        placeholder: secretPlaceholder(setting.isWebhookEndpointSecretSet),
      },
    },
    load,
    save: values =>
      updateSetting({
        variables: toPaymentSettingVariables(setting.id, values),
      }),
  });

  return <FormDrawerPanel controller={controller} />;
}

export function PaymentIntegrationForm() {
  return (
    <IntegrationSettings<PaymentSetting>
      type="payment"
      query={PaymentProviderSettingsDocument}
      dataKey="paymentProviderSettings"
      registry={{
        createMutation: CreatePaymentProviderSettingDocument,
        deleteMutation: DeletePaymentProviderSettingDocument,
        types: creatablePaymentProviderTypes(getSettings().appEnvironment).map(
          value => ({
            label: value,
            value,
          })
        ),
      }}
      getLogo={paymentLogo}
    >
      {setting => <PaymentSettingForm setting={setting} />}
    </IntegrationSettings>
  );
}
