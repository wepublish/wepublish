import { ApolloError } from '@apollo/client';
import {
  FullVoucherFragment,
  MutationUpdateVoucherArgs,
  useUpdateVoucherMutation,
  useVoucherQuery,
} from '@wepublish/editor/api';
import { CanUpdateVoucher } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
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

const mapApiDataToInput = (
  voucher: FullVoucherFragment
): MutationUpdateVoucherArgs => voucher;

const VoucherEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;
  const closePath = './../..';

  const [voucher, setVoucher] = useState<MutationUpdateVoucherArgs>();

  const { loading: dataLoading } = useVoucherQuery({
    variables: {
      id: id as string,
    },
    onError: onErrorToast,
    onCompleted: data => {
      setVoucher(mapApiDataToInput(data.voucher));
    },
  });

  const [updateVoucher, { loading: updateLoading }] = useUpdateVoucherMutation({
    onError: onErrorToast,
    onCompleted: data => {
      if (data.updateVoucher) {
        if (shouldClose) {
          navigate(closePath);
        } else {
          setVoucher(mapApiDataToInput(data.updateVoucher));
        }
      }
    },
  });

  const loading = dataLoading || updateLoading;
  const onSubmit = () => updateVoucher({ variables: voucher });

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

  if (!voucher) {
    return;
  }

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
        title={t('voucher.form.editTitle', { voucher: voucher.code })}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <VoucherForm
        voucher={voucher}
        onChange={changes =>
          setVoucher(oldVoucher => ({ ...oldVoucher, ...(changes as any) }))
        }
      />
    </Form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateVoucher.id,
])(VoucherEditView);
export { CheckedPermissionComponent as VoucherEditView };
