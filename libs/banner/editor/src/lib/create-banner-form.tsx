import { useMutation } from '@apollo/client/react';
import {
  CreateBannerActionInput,
  CreateBannerDocument,
  LoginStatus,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BannerForm,
  createBannerSchema,
  BannerFormValues,
} from './banner-form';
import { SingleViewTitle } from '@wepublish/ui/editor';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';

const removeIdAndTypename = (action: CreateBannerActionInput) => {
  const { id, __typename, ...actionCleaned } =
    action as CreateBannerActionInput & {
      id?: string;
      __typename?: string;
    };
  return actionCleaned;
};

const removeTypename = ({ id }: { id: string }) => ({ id });

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

  const [createBanner, { loading }] = useMutation(CreateBannerDocument, {
    onCompleted: data => {
      if (shouldClose) {
        navigate(closePath);
      } else {
        navigate(`/banners/edit/${data.createBanner.id}`);
      }
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(({ image, id, ...banner }) =>
          createBanner({
            variables: {
              input: {
                ...banner,
                actions: banner.actions?.map(removeIdAndTypename),
                showOnPages: banner.showOnPages?.map(removeTypename),
              },
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
