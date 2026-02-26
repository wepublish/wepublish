import { ApolloError } from '@apollo/client';
import {
  CreateMemberPlanMutationVariables,
  Currency,
  FullAvailablePaymentMethodFragment,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  PaymentMethod,
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
      description: [],
      currency: Currency.Chf,
      amountPerMonthMin: 0,
      amountPerMonthMax: null,
      amountPerMonthTarget: null,
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
    amountPerMonthMin: Schema.Types.NumberType()
      .isRequired(t('memberPlanEdit.amountPerMonthMinRequired'))
      .min(0, t('memberPlanEdit.amountPerMonthMinZero')),

    amountPerMonthMax: Schema.Types.NumberType().min(
      (memberPlan?.amountPerMonthMin || 0) / 100,
      t('memberPlanEdit.maxPriceMustBeGreaterThanMin')
    ),

    amountPerMonthTarget: Schema.Types.NumberType().min(
      ((memberPlan?.amountPerMonthMin || 0) + 1) / 100,
      t('memberPlanEdit.targetPriceMustBeGreaterThanMin')
    ),
    currency: Schema.Types.StringType().isRequired(
      t('memberPlanEdit.currencyRequired')
    ),
  });

  async function saveMemberPlan() {
    if (!memberPlan) {
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
      amountPerMonthMin: memberPlan.amountPerMonthMin,
      amountPerMonthMax: memberPlan.amountPerMonthMax,
      amountPerMonthTarget: memberPlan.amountPerMonthTarget,
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
          amountPerMonthMin: memberPlan?.amountPerMonthMin,
          amountPerMonthMax: memberPlan?.amountPerMonthMax,
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
