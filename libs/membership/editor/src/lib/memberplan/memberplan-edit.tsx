import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import {
  CreateMemberPlanDocument,
  CreateMemberPlanMutationVariables,
  Currency,
  FullAvailablePaymentMethodFragment,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  MemberPlanDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
  ProductType,
  UpdateMemberPlanDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  generateID,
  humanizeError,
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

const showErrors = (error: Error): void => {
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
    {
      loading: memberPlanLoading,
      data: memberPlanData,
      error: memberPlanError,
    },
  ] = useLazyQuery(MemberPlanDocument);

  const {
    data: paymentMethodData,
    loading: paymentMethodLoading,
    error: paymentMethodError,
  } = useQuery(PaymentMethodListDocument);

  useEffect(() => {
    if (memberPlanError) {
      showErrors(memberPlanError);
    }
  }, [memberPlanError]);

  useEffect(() => {
    if (paymentMethodError) {
      showErrors(paymentMethodError);
    }
  }, [paymentMethodError]);

  const [updateMemberPlanMutation, { loading: memberPlanUpdating }] =
    useMutation(UpdateMemberPlanDocument, {
      onError: showErrors,
    });

  const [createMemberPlanMutation, { loading: memberPlanCreating }] =
    useMutation(CreateMemberPlanDocument, {
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
    const initMemberPlan: FullMemberPlanFragment =
      memberPlanData?.memberPlan || {
        __typename: 'MemberPlan',
        id: 'dummy-id',
        // Placeholders like the id: never sent, the api sets both on save.
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        availablePaymentMethods: [],
        description: null,
        shortDescription: null,
        currency: Currency.Chf,
        periodicityPricing: [
          {
            __typename: 'PeriodicityPrice',
            periodicity: PaymentPeriodicity.Monthly,
            label: null,
            amountMin: 0,
            amountTarget: null,
            amountMax: null,
          },
        ],
        defaultPaymentPeriodicity: null,
        image: null,
        active: true,
        tags: [],
        slug: '',
        name: '',
        externalReward: null,
        extendable: true,
        maxCount: null,
        migrateToTargetPaymentMethodID: null,
        successPageId: null,
        failPageId: null,
        confirmationPageId: null,
        productType: ProductType.Subscription,
      };

    setMemberPlan(initMemberPlan);
    setAvailablePaymentMethods(
      (initMemberPlan?.availablePaymentMethods || []).map(
        availablePaymentMethod => ({
          id: generateID(),
          value: availablePaymentMethod,
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
