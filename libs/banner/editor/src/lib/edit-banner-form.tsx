import { useApolloClient, useMutation } from '@apollo/client/react';
import {
  BannerDocument,
  CreateBannerActionInput,
  LoginStatus,
  UpdateBannerDocument,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
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
        query: BannerDocument,
        variables: { id: bannerId },
      });
      const banner = data!.banner!;

      return {
        id: bannerId,
        title: banner.title,
        text: banner.text,
        cta: banner.cta,
        html: banner.html,
        embedUrl: banner.embedUrl,
        active: banner.active,
        collapsible: banner.collapsible,
        delay: banner.delay,
        hideForMinutes: banner.hideForMinutes,
        showForLoginStatus: banner.showForLoginStatus ?? LoginStatus.All,
        showOnArticles: banner.showOnArticles,
        showOnPages: banner.showOnPages?.map(removeTypename) ?? [],
        imageId: banner.image?.id,
        image: banner.image,
        actions: banner.actions ?? [],
      } satisfies BannerFormValues;
    },
  });

  const [shouldClose, setShouldClose] = useState(false);

  const [updateBanner, { loading }] = useMutation(UpdateBannerDocument, {
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
        onSubmit={form.handleSubmit(({ image, ...banner }) =>
          updateBanner({
            variables: {
              input: {
                ...banner,
                id: bannerId,
                actions: banner.actions?.map(removeIdAndTypename),
                showOnPages: banner.showOnPages?.map(removeTypename),
              },
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
