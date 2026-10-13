import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGateDocument, GateMode } from '@wepublish/editor/api';
import { PaywallFormValues, toPaywallGateInput } from '@wepublish/gate/editor';
import { CanCreatePaywall } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { PaywallForm, paywallSchema } from './paywallForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const PaywallCreateView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './../..';

  const form = useForm<PaywallFormValues>({
    resolver: zodResolver(paywallSchema),
    defaultValues: {
      name: '',
      active: true,
      anyMemberPlan: false,
      memberPlanIds: [],
      bypasses: [],
      fadeout: true,
      hideContentAfter: 3,
    },
  });

  const [createPaywall, { loading: updateLoading }] = useMutation(
    CreateGateDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (data.createGate) {
          if (shouldClose) {
            navigate(`./..`);
          } else {
            navigate(`./../edit/${data.createGate.id}`);
          }
        }
      },
    }
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(paywall =>
          createPaywall({
            variables: {
              input: { mode: GateMode.Paywall, ...toPaywallGateInput(paywall) },
            },
          })
        )}
      >
        <SingleViewTitle
          loading={updateLoading}
          title={t('paywall.form.createTitle')}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <PaywallForm create />
      </form>
    </FormProvider>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreatePaywall.id,
])(PaywallCreateView);
export { CheckedPermissionComponent as PaywallCreateView };
