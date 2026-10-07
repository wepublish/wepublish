import { useMutation, useQuery } from '@apollo/client/react';
import {
  FullPaywallFragment,
  MutationUpdatePaywallArgs,
  PaywallListDocument,
  UpdatePaywallDocument,
} from '@wepublish/editor/api';
import { CanUpdatePaywall } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { PaywallForm } from './paywallForm';

const onErrorToast = (error: Error) => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={8000}
    >
      {humanizeError(error)}
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

  const { loading: dataLoading, data, error } = useQuery(PaywallListDocument);

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      const paywallToEdit = data.paywalls.find(paywall => paywall.id === id);

      if (paywallToEdit) {
        setPaywall(mapApiDataToInput(paywallToEdit));
      }
    }
  }, [data, id]);

  const [updatePaywall, { loading: updateLoading }] = useMutation(
    UpdatePaywallDocument,
    {
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
    }
  );

  const loading = dataLoading || updateLoading;
  const onSubmit = () => updatePaywall({ variables: paywall! });

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
