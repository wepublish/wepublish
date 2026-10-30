import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DiscountCodeDocument,
  FullDiscountCodeFragment,
  UpdateDiscountCodeDocument,
} from '@wepublish/editor/api';
import { CanUpdateDiscountCode } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import {
  DiscountCodeForm,
  DiscountCodeFormValues,
  discountCodeSchema,
} from './discountCodeForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const mapApiDataToInput = (
  discountCode: FullDiscountCodeFragment
): DiscountCodeFormValues => ({
  id: discountCode.id,
  code: discountCode.code,
  discountPercent: discountCode.discountPercent,
  memberPlanId: discountCode.memberPlanId,
  memberPlan: discountCode.memberPlan ?? undefined,
  validFrom: discountCode.validFrom,
  validTo: discountCode.validTo,
});

const DiscountCodeEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;
  const closePath = './../..';

  const client = useApolloClient();

  const [updateDiscountCode, { loading: updateLoading }] = useMutation(
    UpdateDiscountCodeDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (data.updateDiscountCode) {
          if (shouldClose) {
            navigate(closePath);
          } else {
            form.reset(mapApiDataToInput(data.updateDiscountCode));
          }
        }
      },
    }
  );

  const form = useForm<DiscountCodeFormValues>({
    resolver: zodResolver(discountCodeSchema),
    defaultValues: async () => {
      const { data } = await client.query({
        query: DiscountCodeDocument,
        variables: { id: id as string },
      });

      return mapApiDataToInput(data!.discountCode);
    },
  });

  const code = useWatch({ control: form.control, name: 'code' });

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ memberPlan, ...discountCode }) =>
          updateDiscountCode({
            variables: { ...discountCode, id: id as string },
          })
        )}
      >
        <SingleViewTitle
          loading={updateLoading}
          title={t('discountCode.form.editTitle', {
            discountCode: code,
          })}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <DiscountCodeForm />
      </form>
    </FormProvider>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateDiscountCode.id,
])(DiscountCodeEditView);
export { CheckedPermissionComponent as DiscountCodeEditView };
