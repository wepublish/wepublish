import { ApolloError } from '@apollo/client';
import {
  MutationCreatePaywallArgs,
  useCreatePaywallMutation,
} from '@wepublish/editor/api';
import { CanCreatePaywall } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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

const PaywallCreateView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './../..';

  const [paywall, setPaywall] = useState<
    MutationCreatePaywallArgs & {
      bypasses?: Array<{ id?: string; token: string }>;
    }
  >(() => ({
    active: true,
    anyMemberPlan: false,
    bypassTokens: [],
    memberPlanIds: [],
    fadeout: true,
    hideContentAfter: 3,
  }));

  const [createPaywall, { loading: updateLoading }] = useCreatePaywallMutation({
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
  });

  const loading = updateLoading;
  const onSubmit = () => createPaywall({ variables: paywall });

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
        title={t('paywall.form.createTitle')}
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
  CanCreatePaywall.id,
])(PaywallCreateView);
export { CheckedPermissionComponent as PaywallCreateView };
