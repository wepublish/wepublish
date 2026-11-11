import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import {
  CreateMemberPlanDocument,
  CreateMemberPlanMutationVariables,
  FullPaymentMethodFragment,
  MemberPlanDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
  UpdateMemberPlanDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  generateID,
  humanizeError,
  SingleView,
  SingleViewContent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { MemberPlanForm } from './memberplan-form';
import {
  createMemberPlanSchema,
  EMPTY_MEMBER_PLAN,
  MemberPlanFormValues,
  prunePricing,
  toFormValues,
} from './memberplan-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import {
  CanCreateMemberPlan,
  CanDeleteMemberPlan,
  CanGetMemberPlan,
  CanGetMemberPlans,
} from '@wepublish/permissions';

const showErrors = (error: Error): void => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const closePath = '/memberplans';

function MemberPlanEdit() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id: memberPlanId } = useParams();
  const client = useApolloClient();

  const [close, setClose] = useState<boolean>(false);

  const form = useForm<MemberPlanFormValues>({
    resolver: zodResolver(createMemberPlanSchema(t)),
    defaultValues: async () => {
      if (!memberPlanId) {
        return EMPTY_MEMBER_PLAN;
      }

      try {
        const { data } = await client.query({
          query: MemberPlanDocument,
          variables: { id: memberPlanId },
        });

        return data?.memberPlan ?
            toFormValues(data.memberPlan, generateID)
          : EMPTY_MEMBER_PLAN;
      } catch (error) {
        showErrors(error as Error);

        return EMPTY_MEMBER_PLAN;
      }
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });

  const { data: paymentMethodData, loading: paymentMethodLoading } = useQuery(
    PaymentMethodListDocument
  );

  const [updateMemberPlanMutation, { loading: memberPlanUpdating }] =
    useMutation(UpdateMemberPlanDocument, {
      onError: showErrors,
    });

  const [createMemberPlanMutation, { loading: memberPlanCreating }] =
    useMutation(CreateMemberPlanDocument, {
      onError: showErrors,
    });

  const loading: boolean =
    form.formState.isLoading ||
    memberPlanUpdating ||
    paymentMethodLoading ||
    memberPlanCreating;

  const paymentMethods: FullPaymentMethodFragment[] = useMemo(
    () => paymentMethodData?.paymentMethods || [],
    [paymentMethodData]
  );

  const header: string =
    name ||
    t(
      memberPlanId ?
        'memberPlanEdit.noMemberPlanName'
      : 'memberPlanEdit.createMemberPlanHeader'
    );

  async function saveMemberPlan(memberPlan: MemberPlanFormValues) {
    const periodicityPricing = prunePricing(memberPlan);

    const memberPlanInput = {
      name: memberPlan.name,
      slug: memberPlan.slug,
      tags: memberPlan.tags,
      imageID: memberPlan.image?.id || null,
      description: memberPlan.description,
      shortDescription: memberPlan.shortDescription,
      active: memberPlan.active,
      availablePaymentMethods: memberPlan.availablePaymentMethods.map(
        ({ value }) => ({
          paymentPeriodicities: value.paymentPeriodicities,
          forceAutoRenewal: value.forceAutoRenewal,
          paymentMethodIDs: value.paymentMethods.map(pm => pm.id),
        })
      ),
      currency: memberPlan.currency,
      periodicityPricing: periodicityPricing.map(
        ({ periodicity, label, amountMin, amountTarget, amountMax }) => ({
          periodicity,
          label,
          amountMin,
          amountTarget,
          amountMax,
        })
      ),
      defaultPaymentPeriodicity:
        (
          memberPlan.defaultPaymentPeriodicity &&
          memberPlan.availablePaymentMethods.some(({ value }) =>
            value.paymentPeriodicities.includes(
              memberPlan.defaultPaymentPeriodicity as PaymentPeriodicity
            )
          )
        ) ?
          memberPlan.defaultPaymentPeriodicity
        : null,
      extendable: memberPlan.extendable,
      externalReward: memberPlan.externalReward,
      maxCount: memberPlan.maxCount,
      productType: memberPlan.productType,
      migrateToTargetPaymentMethodID: memberPlan.migrateToTargetPaymentMethodID,
      successPageId: memberPlan.successPageId,
      failPageId: memberPlan.failPageId,
      confirmationPageId: memberPlan.confirmationPageId,
    } as CreateMemberPlanMutationVariables;

    if (memberPlanId) {
      await updateMemberPlanMutation({
        variables: {
          id: memberPlanId,
          ...memberPlanInput,
        },
        onCompleted: () => {
          enqueueSnackbar(t('memberPlanEdit.savedChanges'), {
            variant: 'success',
          });
        },
      });
    } else {
      await createMemberPlanMutation({
        variables: memberPlanInput,
        onCompleted: data => {
          enqueueSnackbar(t('memberPlanEdit.savedChanges'), {
            variant: 'success',
          });
          navigate(`/memberplans/edit/${data.createMemberPlan?.id}`);
        },
      });
    }

    if (close) {
      navigate(closePath);
    }
  }

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <SingleView>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(saveMemberPlan)}>
          <SingleViewTitle
            loading={loading}
            loadingTitle={t('memberPlanEdit.loadingTitle')}
            title={header}
            saveBtnTitle={t('memberPlanEdit.saveBtnTitle')}
            saveAndCloseBtnTitle={t('memberPlanEdit.saveAndCloseBtnTitle')}
            closePath={closePath}
            setCloseFn={value => setClose(value)}
          />
          <SingleViewContent>
            <MemberPlanForm
              memberPlanId={memberPlanId}
              paymentMethods={paymentMethods}
              loading={loading}
            />
          </SingleViewContent>
        </form>
      </FormProvider>
    </SingleView>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetMemberPlans.id,
  CanGetMemberPlan.id,
  CanCreateMemberPlan.id,
  CanDeleteMemberPlan.id,
])(MemberPlanEdit);
export { CheckedPermissionComponent as MemberPlanEdit };
