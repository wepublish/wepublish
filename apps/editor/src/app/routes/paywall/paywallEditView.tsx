import { ApolloError } from '@apollo/client';
import {
  FullPaywallFragment,
  MutationUpdatePaywallArgs,
  usePaywallListQuery,
  useUpdatePaywallMutation,
} from '@wepublish/editor/api';
import { CanUpdatePaywall } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { PaywallForm } from './paywallForm';

const onErrorToast = (error: ApolloError) => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={3000}
    >
      {error.message}
    </Message>
  );
};

const mapApiDataToInput = (
  paywall: FullPaywallFragment
): MutationUpdatePaywallArgs => ({
  ...paywall,
  memberPlanIds: paywall.memberPlans?.map(memberPlan => memberPlan.id),
  bypassTokens: paywall.bypasses?.map(bypass => bypass.token) || undefined,
});

const PaywallEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;
  const closePath = './../..';

  const [paywall, setPaywall] = useState<
    MutationUpdatePaywallArgs & {
      bypasses?: Array<{ id?: string; token: string }>;
    }
  >();

  const { loading: dataLoading } = usePaywallListQuery({
    fetchPolicy: 'cache-and-network',
    onError: onErrorToast,
    onCompleted: data => {
      const paywallToEdit = data.paywalls.find(paywall => paywall.id === id);

      if (paywallToEdit) {
        setPaywall(mapApiDataToInput(paywallToEdit));
      }
    },
  });

  const [updatePaywall, { loading: updateLoading }] = useUpdatePaywallMutation({
    onError: onErrorToast,
    onCompleted: data => {
      if (data.updatePaywall) {
        if (shouldClose) {
          navigate(closePath);
        } else {
          setPaywall(mapApiDataToInput(data.updatePaywall));
        }
      }
    },
  });

  const loading = dataLoading || updateLoading;
  const onSubmit = () => updatePaywall({ variables: paywall });

  const { StringType, BooleanType, ArrayType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(),
    active: BooleanType().isRequired(),
    anyMemberPlan: BooleanType().isRequired(),
    memberPlanIds: ArrayType().of(StringType()),
    alternativeSubscribeUrl: StringType().isURL(),
  });

  if (!paywall) {
    return;
  }

  return (
    <Form
      fluid
      formValue={paywall || {}}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
    >
      <SingleViewTitle
        loading={loading}
        title={t('paywall.form.editTitle', { paywall: paywall.name })}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <PaywallForm
        paywall={paywall}
        onChange={changes =>
          setPaywall(oldPaywall => ({ ...oldPaywall, ...(changes as any) }))
        }
      />
    </Form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdatePaywall.id,
])(PaywallEditView);
export { CheckedPermissionComponent as PaywallEditView };
