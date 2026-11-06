import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  type DeactivationFragment,
  type FullMemberPlanFragment,
  type FullPaymentMethodFragment,
  CreateSubscriptionDocument,
  Currency,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
  SubscriptionCreationMailDocument,
  SubscriptionDocument,
  UpdateSubscriptionDocument,
  UserDocument,
} from '@wepublish/editor/api';
import {
  type ControllerOptions,
  type FormDefaultValues,
  type FormPaths,
  cancelSave,
  entityProps,
  FormPage,
  useCreateForm,
  useEditForm,
  useQueryLoader,
} from '@wepublish/form/editor';
import {
  CanCancelSubscription,
  CanCreateSubscription,
  CanGetSubscription,
  CanGetSubscriptions,
} from '@wepublish/permissions';
import {
  enqueueSnackbar,
  getMonthlyEquivalentRange,
  Link,
  PermissionControl,
  skipMailFor,
  useActionMailQuestion,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOpenInNew } from 'react-icons/md';
import { useParams, useSearchParams } from 'react-router-dom';

import {
  type LoadedSubscription,
  fromSubscription,
  planMonthlyAmountOf,
  propertiesOf,
  subscriptionSchema,
  toCreateSubscriptionVariables,
  toUpdateSubscriptionVariables,
  withoutMemberPlan,
} from './subscription.schema';
import {
  subscriptionEditPath,
  subscriptionListPath,
  subscriptionView,
} from './subscription.view';
import { SubscriptionActions } from './subscriptionActions';
import { SubscriptionContext } from './subscriptionContext';

const permissions = [
  CanGetSubscription.id,
  CanGetSubscriptions.id,
  CanCreateSubscription.id,
  CanCancelSubscription.id,
];

const writePermissions = [CanCreateSubscription.id];

const noMemberPlans: FullMemberPlanFragment[] = [];

const noPaymentMethods: FullPaymentMethodFragment[] = [];

const ExternalLinkIcon = styled(MdOpenInNew)`
  margin-left: ${({ theme }) => theme.spacing(0.5)};
  vertical-align: middle;
`;

type SubscriptionFields = NonNullable<
  ControllerOptions<typeof subscriptionSchema>['fields']
>;

function OpenInNewTab({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      target="_blank"
    >
      {label}
      <ExternalLinkIcon />
    </Link>
  );
}

const pathsBackTo = (list: string): FormPaths => ({
  list,
  edit: subscriptionEditPath,
});

const closePathFor = (userId: string | null) =>
  userId ? `/users/edit/${userId}` : subscriptionListPath;

const amountText = (cents: number) => (cents / 100).toFixed(2);

const deactivatedBefore = (
  deactivation: DeactivationFragment | null,
  moment: number
) => deactivation !== null && new Date(deactivation.date).getTime() < moment;

const reasonKey = (reason: string) =>
  `userSubscriptionEdit.deactivation.reason${reason.charAt(0).toUpperCase()}${reason.slice(1)}`;

function useSubscriptionFields(): SubscriptionFields {
  const { t } = useTranslation();
  const memberPlans = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });
  const paymentMethods = useQuery(PaymentMethodListDocument);

  return {
    user: {
      helperText: ({ user }) =>
        user ?
          <OpenInNewTab
            to={`/users/edit/${user.id}`}
            label={t('subscriptionEditView.openUser')}
          />
        : undefined,
    },
    memberPlan: {
      props: entityProps({
        options: memberPlans.data?.memberPlans.nodes ?? noMemberPlans,
        getOptionLabel: memberPlan => memberPlan.name,
        loading: memberPlans.loading,
      }),
      helperText: ({ memberPlan }) =>
        memberPlan ?
          <>
            {t('userSubscriptionEdit.memberPlanMonthlyAmount', {
              currency: memberPlan.currency,
            })}
            {': '}
            {amountText(
              getMonthlyEquivalentRange(memberPlan.periodicityPricing)
                .amountPerMonthMin
            )}
            {' · '}
            <OpenInNewTab
              to={`/memberplans/edit/${memberPlan.id}`}
              label={t('subscriptionEditView.openMemberPlan')}
            />
          </>
        : undefined,
      onValueChange: (memberPlan, { getValues, setValue }) => {
        if (!memberPlan) {
          return;
        }

        setValue(
          'monthlyAmount',
          planMonthlyAmountOf(
            memberPlan,
            getValues('paymentPeriodicity') ?? PaymentPeriodicity.Yearly
          )
        );

        if (!memberPlan.extendable) {
          setValue('autoRenew', false);
        }

        if (memberPlan.extendable !== getValues('extendable')) {
          setValue('extendable', memberPlan.extendable);
          enqueueSnackbar(t('subscriptionEditView.extendableWasChanged'), {
            autoHideDuration: 6000,
          });
        }
      },
    },
    monthlyAmount: {
      helperText: ({ memberPlan, paymentPeriodicity, monthlyAmount }) =>
        (
          paymentPeriodicity === PaymentPeriodicity.Monthly ||
          monthlyAmount === null ||
          monthlyAmount === undefined
        ) ?
          undefined
        : <>
            {t('userSubscriptionEdit.monthlyAmountEquivalent', {
              currency: memberPlan?.currency ?? Currency.Chf,
              amount: amountText(monthlyAmount),
            })}
          </>,
    },
    paymentMethod: {
      disabled: withoutMemberPlan,
      props: entityProps({
        options: paymentMethods.data?.paymentMethods ?? noPaymentMethods,
        getOptionLabel: paymentMethod => paymentMethod.name,
        loading: paymentMethods.loading,
      }),
    },
  };
}

type SubscriptionCreateFormProps = {
  defaultValues?: FormDefaultValues<typeof subscriptionSchema>;
  closePath: string;
};

export function SubscriptionCreateForm({
  defaultValues,
  closePath,
}: SubscriptionCreateFormProps) {
  const client = useApolloClient();
  const { askMail, actionMailDialog } = useActionMailQuestion();
  const fields = useSubscriptionFields();
  const [createSubscription] = useMutation(CreateSubscriptionDocument);
  const subscription = useCreateForm(subscriptionView, {
    title: 'userSubscriptionEdit.createTitle',
    defaultValues,
    paths: pathsBackTo(closePath),
    writePermissions,
    fields: { ...fields, paidUntil: { hidden: true } },
    save: async values => {
      const { data: mailData } = await client.query({
        query: SubscriptionCreationMailDocument,
        variables: {
          userID: values.user.id,
          memberPlanID: values.memberPlan.id,
          paymentMethodID: values.paymentMethod.id,
          paymentPeriodicity: values.paymentPeriodicity,
          autoRenew: values.autoRenew,
        },
        fetchPolicy: 'network-only',
      });
      const mail = mailData?.subscriptionCreationMail;

      if (!mail) {
        throw new Error('Could not look up the mail of this action');
      }

      const decision = await askMail({
        ...mail,
        recipient: mail.recipientEmail ?? values.user.email,
      });

      if (decision === 'cancel') {
        cancelSave();
      }

      const { data } = await createSubscription({
        variables: toCreateSubscriptionVariables(values, skipMailFor(decision)),
      });

      return data?.createSubscription.id;
    },
  });

  return (
    <>
      <FormPage controller={subscription} />
      {actionMailDialog}
    </>
  );
}

type SubscriptionCreateForUserProps = {
  userId: string;
  closePath: string;
};

function SubscriptionCreateForUser({
  userId,
  closePath,
}: SubscriptionCreateForUserProps) {
  const { data } = useQuery(UserDocument, { variables: { id: userId } });

  return data === undefined ? null : (
      <SubscriptionCreateForm
        defaultValues={{ user: data.user }}
        closePath={closePath}
      />
    );
}

type Loaded = {
  readonly subscription: LoadedSubscription;
  readonly deactivated: boolean;
};

function DeactivationStatus({
  deactivation,
  deactivated,
}: {
  deactivation: DeactivationFragment;
  deactivated: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      {t(
        deactivated ?
          'userSubscriptionEdit.reactivation.deactivatedSince'
        : 'userSubscriptionEdit.reactivation.deactivatedOn',
        {
          date: new Date(deactivation.date),
          reason: t(reasonKey(deactivation.reason)),
        }
      )}
    </>
  );
}

type SubscriptionEditFormProps = {
  id: string;
  closePath: string;
};

export function SubscriptionEditForm({
  id,
  closePath,
}: SubscriptionEditFormProps) {
  const { askMail, actionMailDialog } = useActionMailQuestion();
  const fields = useSubscriptionFields();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const loadSubscription = useQueryLoader(
    SubscriptionDocument,
    { id },
    data => data.subscription
  );
  const [updateSubscription] = useMutation(UpdateSubscriptionDocument);
  const deactivation = loaded === null ? null : loaded.subscription.deactivation;
  const deactivated = loaded !== null && loaded.deactivated;
  const subscription = useEditForm(subscriptionView, {
    title: 'userSubscriptionEdit.editTitle',
    subtitle:
      deactivation === null ? undefined : (
        <DeactivationStatus
          deactivation={deactivation}
          deactivated={deactivated}
        />
      ),
    paths: pathsBackTo(closePath),
    readOnly: deactivated,
    writePermissions,
    fields,
    headerActions: <SubscriptionActions />,
    load: async () => {
      const record = await loadSubscription();

      setLoaded({
        subscription: record,
        deactivated: deactivatedBefore(record.deactivation, Date.now()),
      });

      return fromSubscription(record);
    },
    save: values =>
      updateSubscription({
        variables: toUpdateSubscriptionVariables(
          id,
          values,
          loaded === null ? [] : propertiesOf(loaded.subscription)
        ),
      }),
  });

  return (
    <SubscriptionContext.Provider
      value={{
        subscription: loaded === null ? null : loaded.subscription,
        deactivated,
        reload: subscription.handle.retry,
        askMail,
      }}
    >
      <FormPage controller={subscription} />
      {actionMailDialog}
    </SubscriptionContext.Provider>
  );
}

function SubscriptionRoute() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const closePath = closePathFor(userId);

  if (id !== undefined) {
    return (
      <SubscriptionEditForm
        key={id}
        id={id}
        closePath={closePath}
      />
    );
  }

  return userId ?
      <SubscriptionCreateForUser
        key={userId}
        userId={userId}
        closePath={closePath}
      />
    : <SubscriptionCreateForm closePath={closePath} />;
}

export function SubscriptionEditView() {
  return (
    <PermissionControl
      qualifyingPermissions={permissions}
      showRejectionMessage
    >
      <SubscriptionRoute />
    </PermissionControl>
  );
}
