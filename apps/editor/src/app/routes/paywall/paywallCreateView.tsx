import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePaywallDocument } from '@wepublish/editor/api';
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
import { useNavigate, useSearchParams } from 'react-router-dom';

import { PaywallForm, PaywallFormValues, paywallSchema } from './paywallForm';

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
  const [searchParams] = useSearchParams();
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
      // "Restrict premium content" in Audience Engagement opens this form.
      enforced: searchParams.get('enforced') === 'true',
    },
  });

  const [createPaywall, { loading: updateLoading }] = useMutation(
    CreatePaywallDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (data.createPaywall) {
          if (shouldClose) {
            navigate(`./..`);
          } else {
            navigate(`./../edit/${data.createPaywall.id}`);
          }
        }
      },
    }
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(
          ({ memberPlans, bypasses, id, ...paywall }) =>
            createPaywall({
              variables: {
                ...paywall,
                bypassTokens: bypasses.map(bypass => bypass.token),
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
