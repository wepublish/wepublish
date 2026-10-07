import { useMutation } from '@apollo/client/react';
import {
  CreateDiscountCodeDocument,
  MutationCreateDiscountCodeArgs,
} from '@wepublish/editor/api';
import { CanCreateDiscountCode } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { DiscountCodeForm } from './discountCodeForm';

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

const DiscountCodeCreateView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './..';

  const [discountCode, setDiscountCode] =
    useState<MutationCreateDiscountCodeArgs>();

  const [createDiscountCode, { loading: updateLoading }] = useMutation(
    CreateDiscountCodeDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (data.createDiscountCode) {
          if (shouldClose) {
            navigate(`./..`);
          } else {
            navigate(`./../edit/${data.createDiscountCode.id}`);
          }
        }
      },
    }
  );

  const loading = updateLoading;
  const onSubmit = () => createDiscountCode({ variables: discountCode! });

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
        title={t('discountCode.form.createTitle')}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <DiscountCodeForm
        discountCode={discountCode ?? {}}
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
  CanCreateDiscountCode.id,
])(DiscountCodeCreateView);
export { CheckedPermissionComponent as DiscountCodeCreateView };
