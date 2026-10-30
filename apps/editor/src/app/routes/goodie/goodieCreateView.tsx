import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGoodieDocument } from '@wepublish/editor/api';
import { CanCreateGoodie } from '@wepublish/permissions';
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

import { GoodieForm, GoodieFormValues, goodieSchema } from './goodieForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const GoodieCreateView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './..';

  const form = useForm<GoodieFormValues>({
    resolver: zodResolver(goodieSchema),
    defaultValues: { name: '', active: true, memberPlanIDs: [] },
  });

  const [createGoodie, { loading }] = useMutation(CreateGoodieDocument, {
    onError: onErrorToast,
    onCompleted: data => {
      if (data.createGoodie) {
        if (shouldClose) {
          navigate(`./..`);
        } else {
          navigate(`./../edit/${data.createGoodie.id}`);
        }
      }
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ image, memberPlans, id, ...goodie }) =>
          createGoodie({ variables: goodie })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('goodie.form.createTitle')}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <GoodieForm create />
      </form>
    </FormProvider>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateGoodie.id,
])(GoodieCreateView);
export { CheckedPermissionComponent as GoodieCreateView };
