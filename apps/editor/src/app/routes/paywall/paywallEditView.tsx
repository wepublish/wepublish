import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FullPaywallFragment,
  PaywallListDocument,
  UpdatePaywallDocument,
} from '@wepublish/editor/api';
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

import { PaywallForm, PaywallFormValues, paywallSchema } from './paywallForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const mapApiDataToInput = (
  paywall: FullPaywallFragment
): PaywallFormValues => ({
  id: paywall.id,
  name: paywall.name,
  description: paywall.description,
  circumventDescription: paywall.circumventDescription,
  upgradeDescription: paywall.upgradeDescription,
  upgradeCircumventDescription: paywall.upgradeCircumventDescription,
  active: paywall.active,
  anyMemberPlan: paywall.anyMemberPlan,
  memberPlans: paywall.memberPlans ?? undefined,
  memberPlanIds: paywall.memberPlans?.map(memberPlan => memberPlan.id) ?? [],
  alternativeSubscribeUrl: paywall.alternativeSubscribeUrl,
  hideContentAfter: paywall.hideContentAfter ?? 3,
  fadeout: paywall.fadeout ?? true,
  enforced: paywall.enforced,
  bypasses: paywall.bypasses ?? [],
});

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
      const { data } = await client.query({ query: PaywallListDocument });
      const paywall = data?.paywalls.find(candidate => candidate.id === id);

      return paywall ?
          mapApiDataToInput(paywall)
        : ({ bypasses: [] } as unknown as PaywallFormValues);
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });

  const [updatePaywall, { loading: updateLoading }] = useMutation(
    UpdatePaywallDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (data.updatePaywall) {
          if (shouldClose) {
            navigate(closePath);
          } else {
            form.reset(mapApiDataToInput(data.updatePaywall));
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
        onSubmit={form.handleSubmit(({ memberPlans, bypasses, ...paywall }) =>
          updatePaywall({
            variables: {
              ...paywall,
              id: id as string,
              bypassTokens: bypasses.map(bypass => bypass.token),
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
