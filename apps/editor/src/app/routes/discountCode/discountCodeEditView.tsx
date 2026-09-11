import { ApolloError } from '@apollo/client';
import {
  FullDiscountCodeFragment,
  MutationUpdateDiscountCodeArgs,
  useDiscountCodeQuery,
  useUpdateDiscountCodeMutation,
} from '@wepublish/editor/api';
import { CanUpdateDiscountCode } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { DiscountCodeForm } from './discountCodeForm';

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
  discountCode: FullDiscountCodeFragment
): MutationUpdateDiscountCodeArgs => discountCode;

const DiscountCodeEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;
  const closePath = './../..';

  const [discountCode, setDiscountCode] =
    useState<MutationUpdateDiscountCodeArgs>();

  const { loading: dataLoading } = useDiscountCodeQuery({
    variables: {
      id: id as string,
    },
    onError: onErrorToast,
    onCompleted: data => {
      setDiscountCode(mapApiDataToInput(data.discountCode));
    },
  });

  const [updateDiscountCode, { loading: updateLoading }] =
    useUpdateDiscountCodeMutation({
      onError: onErrorToast,
      onCompleted: data => {
        if (data.updateDiscountCode) {
          if (shouldClose) {
            navigate(closePath);
          } else {
            setDiscountCode(mapApiDataToInput(data.updateDiscountCode));
          }
        }
      },
    });

  const loading = dataLoading || updateLoading;
  const onSubmit = () => updateDiscountCode({ variables: discountCode });

  const { StringType, DateType, NumberType } = Schema.Types;
  const validationModel = Schema.Model({
    code: StringType().minLength(3).isRequired(),
    discountPercent: NumberType().min(0).max(100).isInteger().isRequired(),
    validFrom: DateType().isRequired(),
    validTo: DateType()
      .min(new Date(discountCode?.validFrom ?? new Date()))
      .isRequired(),
    memberPlanId: StringType().isRequired(),
  });

  if (!discountCode) {
    return;
  }

  return (
    <Form
      fluid
      formValue={discountCode || {}}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
    >
      <SingleViewTitle
        loading={loading}
        title={t('discountCode.form.editTitle', {
          discountCode: discountCode.code,
        })}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <DiscountCodeForm
        discountCode={discountCode}
        onChange={changes =>
          setDiscountCode(oldDiscountCode => ({
            ...oldDiscountCode,
            ...(changes as any),
          }))
        }
      />
    </Form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateDiscountCode.id,
])(DiscountCodeEditView);
export { CheckedPermissionComponent as DiscountCodeEditView };
