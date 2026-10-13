import { useMutation } from '@apollo/client/react';
import {
  CreateGateDocument,
  GateMode,
  LoginStatus,
} from '@wepublish/editor/api';
import { BannerFormValues, toBannerGateInput } from '@wepublish/gate/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BannerForm, createBannerSchema } from './banner-form';
import { SingleViewTitle } from '@wepublish/ui/editor';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';

const EMPTY_BANNER = {
  title: '',
  text: '',
  active: false,
  collapsible: true,
  showOnArticles: false,
  showForLoginStatus: LoginStatus.All,
  showOnPages: [],
  delay: 0,
  hideForMinutes: 24 * 60,
  actions: [],
} satisfies BannerFormValues;

export const CreateBannerForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/banners';

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(createBannerSchema(t)),
    defaultValues: EMPTY_BANNER,
  });

  const [shouldClose, setShouldClose] = useState(false);

  const [createBanner, { loading }] = useMutation(CreateGateDocument, {
    onCompleted: data => {
      if (shouldClose) {
        navigate(closePath);
      } else {
        navigate(`/banners/edit/${data.createGate.id}`);
      }
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(banner =>
          createBanner({
            variables: {
              input: { mode: GateMode.Banner, ...toBannerGateInput(banner) },
            },
          })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('banner.create.title')}
          loadingTitle={t('banner.create.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <BannerForm create />
      </form>
    </FormProvider>
  );
};
