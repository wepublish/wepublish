import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDiscountCodeDocument } from '@wepublish/editor/api';
import { CanCreateDiscountCode } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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

const DiscountCodeCreateView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './..';

  const form = useForm<DiscountCodeFormValues>({
    resolver: zodResolver(discountCodeSchema),
    defaultValues: {
      code: '',
      discountPercent: 0,
      memberPlanId: '',
      validFrom: '',
      validTo: '',
    },
  });

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

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ memberPlan, id, ...discountCode }) =>
          createDiscountCode({ variables: discountCode })
        )}
      >
        <SingleViewTitle
          loading={updateLoading}
          title={t('discountCode.form.createTitle')}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <DiscountCodeForm create />
      </form>
    </FormProvider>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateDiscountCode.id,
])(DiscountCodeCreateView);
export { CheckedPermissionComponent as DiscountCodeCreateView };
