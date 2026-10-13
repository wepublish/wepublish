import { useApolloClient, useMutation } from '@apollo/client/react';
import { GateDocument, UpdateGateDocument } from '@wepublish/editor/api';
import {
  bannerFromGate,
  BannerFormValues,
  toBannerGateInput,
} from '@wepublish/gate/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { BannerForm, createBannerSchema } from './banner-form';
import { SingleViewTitle } from '@wepublish/ui/editor';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';

export const EditBannerForm = () => {
  const { id } = useParams();
  const bannerId = id!;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const client = useApolloClient();

  const closePath = '/banners';

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(createBannerSchema(t)),
    defaultValues: async () => {
      const { data } = await client.query({
        query: GateDocument,
        variables: { id: bannerId },
      });

      return bannerFromGate(data!.gate);
    },
  });

  const [shouldClose, setShouldClose] = useState(false);

  const [updateBanner, { loading }] = useMutation(UpdateGateDocument, {
    onCompleted: () => {
      if (shouldClose) {
        navigate(closePath);
      }
    },
  });

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(banner =>
          updateBanner({
            variables: {
              input: { id: bannerId, ...toBannerGateInput(banner) },
            },
          })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('banner.edit.title')}
          loadingTitle={t('banner.edit.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <BannerForm />
      </form>
    </FormProvider>
  );
};
