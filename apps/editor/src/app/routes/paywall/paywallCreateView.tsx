import { ApolloError } from '@apollo/client';
import {
  FullPaywallFragment,
  getApiClientV2,
  MutationCreatePaywallArgs,
  useCreatePaywallMutation,
  usePaywallListQuery,
} from '@wepublish/editor/api-v2';
import { CanCreatePaywall } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOutlineSave } from 'react-icons/md';
import {
  Form,
  IconButton as RIconButton,
  Message,
  Schema,
  toaster,
} from 'rsuite';

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
): MutationCreatePaywallArgs => ({
  ...paywall,
  memberPlanIds: paywall.memberPlans?.map(memberPlan => memberPlan.id),
  bypassTokens: paywall.bypasses?.map(bypass => bypass.token) || undefined,
});

const PaywallCreateView = () => {
  const { t } = useTranslation();
  const [paywall, setPaywall] = useState<
    MutationCreatePaywallArgs & {
      bypasses?: Array<{ id?: string; token: string }>;
    }
  >();

  const client = getApiClientV2();
  const { loading: dataLoading } = usePaywallListQuery({
    client,
    onError: onErrorToast,
    onCompleted: data => {
      if (data.paywalls) {
        setPaywall(mapApiDataToInput(data.paywalls[0]));
      }
    },
  });

  const [createPaywall, { loading: updateLoading }] = useCreatePaywallMutation({
    client,
    onError: onErrorToast,
    onCompleted: data => {
      if (data.createPaywall) {
        setPaywall(mapApiDataToInput(data.createPaywall));
      }
    },
  });

  const loading = dataLoading || updateLoading;
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
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('paywall.form.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <RIconButton
            type="submit"
            appearance="primary"
            disabled={loading}
            icon={<MdOutlineSave />}
          >
            {t('save')}
          </RIconButton>
        </ListViewActions>
      </ListViewContainer>

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
