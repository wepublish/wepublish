import { ApolloError } from '@apollo/client';
import {
  CreateMemberPlanMutationVariables,
  Currency,
  FullAvailablePaymentMethodFragment,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  PaymentMethod,
  PaymentPeriodicity,
  ProductType,
  useCreateMemberPlanMutation,
  useMemberPlanLazyQuery,
  useUpdateMemberPlanMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  generateID,
  ListValue,
  SingleView,
  SingleViewContent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';
import { MemberPlanForm } from './memberplan-form';
import { usePaymentMethodListQuery } from '@wepublish/editor/api';

const showErrors = (error: ApolloError): void => {
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

const closePath = '/memberplans';

function MemberPlanEdit() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id: memberPlanId } = useParams();

  const [memberPlan, setMemberPlan] = useState<FullMemberPlanFragment | null>();
  const [close, setClose] = useState<boolean>(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<
    ListValue<FullAvailablePaymentMethodFragment>[]
  >([]);

  const [
    fetchMemberPlan,
    { loading: memberPlanLoading, data: memberPlanData },
  ] = useMemberPlanLazyQuery({
    onError: showErrors,
  });

  const { data: paymentMethodData, loading: paymentMethodLoading } =
    usePaymentMethodListQuery({
      onError: showErrors,
    });

  const [updateMemberPlanMutation, { loading: memberPlanUpdating }] =
    useUpdateMemberPlanMutation({
      onError: showErrors,
    });

  const [createMemberPlanMutation, { loading: memberPlanCreating }] =
    useCreateMemberPlanMutation({
      onError: showErrors,
    });

  useEffect(() => {
    if (!memberPlanId) {
      return;
    }

    fetchMemberPlan({
      variables: {
        id: memberPlanId,
      },
    });
  }, [fetchMemberPlan, memberPlanId]);

  // initially set member plan and available payment methods
  useEffect(() => {
    const initMemberPlan = memberPlanData?.memberPlan || {
      id: 'dummy-id',
      availablePaymentMethods: [],
      description: undefined,
      currency: Currency.Chf,
      periodicityPricing: [
        {
          periodicity: PaymentPeriodicity.Monthly,
          label: null,
          amountMin: 0,
          amountTarget: null,
          amountMax: null,
        },
      ],
      defaultPaymentPeriodicity: null,
      image: undefined,
      active: true,
      tags: [],
      slug: '',
      name: '',
      externalReward: undefined,
      extendable: true,
      maxCount: undefined,
      productType: ProductType.Subscription,
    };

    setMemberPlan(initMemberPlan);
    setAvailablePaymentMethods(
      (initMemberPlan?.availablePaymentMethods || []).map(
        availablePaymentMethod => ({
          id: generateID(),
          value: {
            ...availablePaymentMethod,
            paymentMethods:
              availablePaymentMethod.paymentMethods as PaymentMethod[],
          },
        })
      )
    );
  }, [memberPlanData]);

  const loading: boolean = useMemo(
    () =>
      memberPlanLoading ||
      memberPlanUpdating ||
      paymentMethodLoading ||
      memberPlanCreating,
    [
      memberPlanLoading,
      memberPlanUpdating,
      paymentMethodLoading,
      memberPlanCreating,
    ]
  );

  const paymentMethods: FullPaymentMethodFragment[] = useMemo(
    () => paymentMethodData?.paymentMethods || [],
    [paymentMethodData]
  );

  const header: string = useMemo(() => {
    if (!memberPlanId) {
      return memberPlan?.name || t('memberPlanEdit.createMemberPlanHeader');
    }

    return memberPlan?.name || t('memberPlanEdit.noMemberPlanName');
  }, [t, memberPlanId, memberPlan?.name]);

  const validationModel = Schema.Model({
    name: Schema.Types.StringType().isRequired(
      t('memberPlanEdit.nameRequired')
    ),
    slug: Schema.Types.StringType().isRequired(
      t('memberPlanEdit.slugRequired')
    ),
    currency: Schema.Types.StringType().isRequired(
      t('memberPlanEdit.currencyRequired')
    ),
  });

  async function saveMemberPlan() {
    if (!memberPlan) {
      return;
    }

    const prunedPricing = (memberPlan.periodicityPricing ?? []).filter(
      price =>
        availablePaymentMethods.some(({ value }) =>
          value.paymentPeriodicities.includes(price.periodicity)
        ) &&
        (price.label != null || price.amountMin != null)
    );

    const pricedMonthlyRow = (memberPlan.periodicityPricing ?? []).find(
      price =>
        price.periodicity === PaymentPeriodicity.Monthly &&
        price.amountMin != null
    );

    const periodicityPricing =
      (
        !prunedPricing.some(price => price.amountMin != null) &&
        pricedMonthlyRow
      ) ?
        [
          ...prunedPricing.filter(
            price => price.periodicity !== PaymentPeriodicity.Monthly
          ),
          pricedMonthlyRow,
        ]
      : prunedPricing;

    const hasInvalidRow = periodicityPricing.some(
      price =>
        price.amountMin != null &&
        ((price.amountTarget != null &&
          (price.amountTarget < price.amountMin ||
            (price.amountMax != null &&
              price.amountTarget > price.amountMax))) ||
          (price.amountMax != null && price.amountMax < price.amountMin))
    );

    if (!periodicityPricing.some(price => price.amountMin != null)) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {t('memberplanForm.periodicityPricingRequired')}
        </Message>
      );

      return;
    }

    if (hasInvalidRow) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {t('memberPlanEdit.targetPriceMustBeGreaterThanMin')}
        </Message>
      );

      return;
    }

    const memberPlanInput = {
      name: memberPlan.name,
      slug: memberPlan.slug,
      tags: memberPlan.tags,
      imageID: memberPlan.image?.id || null,
      description: memberPlan.description,
      shortDescription: memberPlan.shortDescription,
      active: memberPlan.active,
      availablePaymentMethods: availablePaymentMethods.map(({ value }) => ({
        paymentPeriodicities: value.paymentPeriodicities,
        forceAutoRenewal: value.forceAutoRenewal,
        paymentMethodIDs: value.paymentMethods.map(pm => pm.id),
      })),
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
          availablePaymentMethods.some(({ value }) =>
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

    // update member plan
    if (memberPlanId) {
      await updateMemberPlanMutation({
        variables: {
          id: memberPlanId,
          ...memberPlanInput,
        },
        onCompleted: data => {
          toaster.push(
            <Message
              type="success"
              closable
            >
              {t('memberPlanEdit.savedChanges')}
            </Message>
          );
        },
      });
    } else {
      // create new member plan
      await createMemberPlanMutation({
        variables: memberPlanInput,
        onCompleted: data => {
          toaster.push(
            <Message
              type="success"
              closable
            >
              {t('memberPlanEdit.savedChanges')}
            </Message>
          );
          navigate(`/memberplans/edit/${data.createMemberPlan?.id}`);
        },
      });
    }

    if (close) {
      navigate(closePath);
    }
  }

  return (
    <SingleView>
      <Form
        onSubmit={validationPassed => validationPassed && saveMemberPlan()}
        model={validationModel}
        fluid
        disabled={loading}
        formValue={{
          name: memberPlan?.name,
          slug: memberPlan?.slug,
          currency: memberPlan?.currency,
        }}
      >
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
            memberPlan={memberPlan}
            availablePaymentMethods={availablePaymentMethods}
            paymentMethods={paymentMethods}
            loading={loading}
            setMemberPlan={setMemberPlan}
            setAvailablePaymentMethods={setAvailablePaymentMethods}
          />
        </SingleViewContent>
      </Form>
    </SingleView>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MEMBER_PLANS',
  'CAN_GET_MEMBER_PLAN',
  'CAN_CREATE_MEMBER_PLAN',
  'CAN_DELETE_MEMBER_PLAN',
])(MemberPlanEdit);
export { CheckedPermissionComponent as MemberPlanEdit };
