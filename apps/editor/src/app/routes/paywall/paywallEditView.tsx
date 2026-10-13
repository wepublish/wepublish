import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { GateDocument, UpdateGateDocument } from '@wepublish/editor/api';
import {
  paywallFromGate,
  PaywallFormValues,
  toPaywallGateInput,
} from '@wepublish/gate/editor';
import { CanUpdatePaywall } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { PaywallForm, paywallSchema } from './paywallForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const PaywallEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const closePath = './../..';
  const client = useApolloClient();

  const form = useForm<PaywallFormValues>({
    resolver: zodResolver(paywallSchema),
    defaultValues: async () => {
      const { data } = await client.query({
        query: GateDocument,
        variables: { id: id as string },
      });

      return data ?
          paywallFromGate(data.gate)
        : ({ bypasses: [] } as unknown as PaywallFormValues);
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });

  const [updatePaywall, { loading: updateLoading }] = useMutation(
    UpdateGateDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (data.updateGate) {
          if (shouldClose) {
            navigate(closePath);
          } else {
            form.reset(paywallFromGate(data.updateGate));
          }
        }
      },
    }
  );

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(paywall =>
          updatePaywall({
            variables: {
              input: { id: id as string, ...toPaywallGateInput(paywall) },
            },
          })
        )}
      >
        <SingleViewTitle
          loading={updateLoading}
          title={t('paywall.form.editTitle', { paywall: name })}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <PaywallForm />
      </form>
    </FormProvider>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdatePaywall.id,
])(PaywallEditView);
export { CheckedPermissionComponent as PaywallEditView };
