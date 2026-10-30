import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FullGoodieFragment,
  GoodieDocument,
  UpdateGoodieDocument,
} from '@wepublish/editor/api';
import { CanUpdateGoodie } from '@wepublish/permissions';
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

import { GoodieForm, GoodieFormValues, goodieSchema } from './goodieForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const mapApiDataToInput = (goodie: FullGoodieFragment): GoodieFormValues => ({
  id: goodie.id,
  name: goodie.name,
  stock: goodie.stock,
  active: goodie.active,
  description: goodie.description,
  image: goodie.image,
  imageID: goodie.image?.id,
  memberPlans: goodie.memberPlans,
  memberPlanIDs: goodie.memberPlans.map(memberPlan => memberPlan.id),
});

const GoodieEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const closePath = './../..';
  const client = useApolloClient();

  const form = useForm<GoodieFormValues>({
    resolver: zodResolver(goodieSchema),
    defaultValues: async () => {
      const { data } = await client.query({
        query: GoodieDocument,
        variables: { id: id as string },
      });

      return mapApiDataToInput(data!.goodie);
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });

  const [updateGoodie, { loading: updateLoading }] = useMutation(
    UpdateGoodieDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (data.updateGoodie) {
          if (shouldClose) {
            navigate(closePath);
          } else {
            form.reset(mapApiDataToInput(data.updateGoodie));
          }
        }
      },
    }
  );

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ image, memberPlans, ...goodie }) =>
          updateGoodie({ variables: { ...goodie, id: id as string } })
        )}
      >
        <SingleViewTitle
          loading={updateLoading}
          title={t('goodie.form.editTitle', { goodie: name })}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <GoodieForm />
      </form>
    </FormProvider>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateGoodie.id,
])(GoodieEditView);
export { CheckedPermissionComponent as GoodieEditView };
