import { useMutation, useQuery } from '@apollo/client/react';
import {
  CreatePaymentMethodDocument,
  type FullPaymentProviderFragment,
  PaymentMethodDocument,
  PaymentMethodListDocument,
  PaymentProviderListDocument,
  UpdatePaymentMethodDocument,
} from '@wepublish/editor/api';
import {
  FormDrawer,
  FormDrawerPanel,
  useCreateForm,
  useEditForm,
  useQueryLoader,
  useRouteDrawer,
} from '@wepublish/form/editor';
import { CanCreatePaymentMethod } from '@wepublish/permissions';
import { humanizeError } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import {
  fromPaymentMethod,
  toPaymentMethodVariables,
} from './paymentMethod.schema';
import { paymentMethodRoutes, paymentMethodView } from './paymentMethod.view';

const writePermissions = [CanCreatePaymentMethod.id];

const noProviders: FullPaymentProviderFragment[] = [];

function usePaymentProviderField() {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery(PaymentProviderListDocument);
  const providers = data?.paymentProviders ?? noProviders;

  return {
    options: providers.map(({ id, name }) => ({ value: id, label: name ?? id })),
    disabled: loading,
    helperText:
      error === undefined ? undefined : <>{humanizeError(error, t)}</>,
  };
}

export function PaymentMethodCreateForm() {
  const paymentProviderID = usePaymentProviderField();
  const [createPaymentMethod] = useMutation(CreatePaymentMethodDocument, {
    refetchQueries: [PaymentMethodListDocument],
  });
  const paymentMethod = useCreateForm(paymentMethodView, {
    title: 'paymentMethodList.createTitle',
    writePermissions,
    fields: { paymentProviderID },
    save: async values => {
      const { data } = await createPaymentMethod({
        variables: toPaymentMethodVariables(values),
      });

      return data?.createPaymentMethod.id;
    },
  });

  return <FormDrawerPanel controller={paymentMethod} />;
}

type PaymentMethodEditFormProps = {
  paymentMethodId: string;
};

export function PaymentMethodEditForm({
  paymentMethodId,
}: PaymentMethodEditFormProps) {
  const paymentProviderID = usePaymentProviderField();
  const load = useQueryLoader(
    PaymentMethodDocument,
    { id: paymentMethodId },
    data => fromPaymentMethod(data.paymentMethod)
  );
  const [updatePaymentMethod] = useMutation(UpdatePaymentMethodDocument);
  const paymentMethod = useEditForm(paymentMethodView, {
    title: 'paymentMethodList.editTitle',
    writePermissions,
    fields: { paymentProviderID },
    load,
    save: values =>
      updatePaymentMethod({
        variables: { id: paymentMethodId, ...toPaymentMethodVariables(values) },
      }),
  });

  return <FormDrawerPanel controller={paymentMethod} />;
}

export function PaymentMethodDrawer() {
  const drawer = useRouteDrawer(paymentMethodRoutes);

  return (
    <FormDrawer
      open={drawer.open}
      onClose={drawer.close}
      width="md"
    >
      {drawer.mode === 'edit' && drawer.id !== undefined ?
        <PaymentMethodEditForm
          key={drawer.id}
          paymentMethodId={drawer.id}
        />
      : <PaymentMethodCreateForm />}
    </FormDrawer>
  );
}
