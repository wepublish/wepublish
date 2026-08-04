import { ApolloError } from '@apollo/client';
import {
  MutationCreateVoucherArgs,
  useCreateVoucherMutation,
} from '@wepublish/editor/api';
import { CanCreateVoucher } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { VoucherForm } from './voucherForm';

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

const VoucherCreateView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './..';

  const [voucher, setVoucher] = useState<MutationCreateVoucherArgs>();

  const [createVoucher, { loading: updateLoading }] = useCreateVoucherMutation({
    onError: onErrorToast,
    onCompleted: data => {
      if (data.createVoucher) {
        if (shouldClose) {
          navigate(`./..`);
        } else {
          navigate(`./../edit/${data.createVoucher.id}`);
        }
      }
    },
  });

  const loading = updateLoading;
  const onSubmit = () => createVoucher({ variables: voucher });

  const { StringType, DateType, NumberType } = Schema.Types;
  const validationModel = Schema.Model({
    code: StringType().minLength(3).isRequired(),
    discountPercent: NumberType().min(0).max(100).isInteger().isRequired(),
    validFrom: DateType().isRequired(),
    validTo: DateType()
      .min(new Date(voucher?.validFrom ?? new Date()))
      .isRequired(),
    memberPlanId: StringType().isRequired(),
  });

  return (
    <Form
      fluid
      formValue={voucher || {}}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
    >
      <SingleViewTitle
        loading={loading}
        title={t('voucher.form.createTitle')}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <VoucherForm
        voucher={voucher ?? {}}
        onChange={changes =>
          setVoucher(oldVoucher => ({ ...oldVoucher, ...(changes as any) }))
        }
      />
    </Form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateVoucher.id,
])(VoucherCreateView);
export { CheckedPermissionComponent as VoucherCreateView };
