import React from 'react';
import {
  CreateBannerActionInput,
  CreateBannerInput,
  FullImageFragment,
  useCreateBannerMutation,
  LoginStatus,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BannerForm } from './banner-form';
import { SingleViewTitle } from '@wepublish/ui/editor';
import { Form, Schema } from 'rsuite';

export const CreateBannerForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/banners';

  const [banner, setBanner] = useState({
    active: false,
    showOnArticles: false,
    showForLoginStatus: LoginStatus.All,
    delay: 0,
  } as CreateBannerInput & { image?: FullImageFragment | null });

  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    title: StringType().isRequired(),
    text: StringType().isRequired(),
  });

  const [shouldClose, setShouldClose] = useState(false);

  const [createBanner, { loading }] = useCreateBannerMutation({
    onError: error => {
      console.log(error);
    },
    onCompleted: banner => {
      if (shouldClose) {
        navigate(closePath);
      }
    },
  });

  const onSubmit = () => {
    const { image, ...bannerWithoutImage } = banner;
    const processedBanner = {
      ...bannerWithoutImage,
      actions: banner.actions?.map(removeIdAndTypename),
      showOnPages: banner.showOnPages?.map(removeTypename),
    };
    createBanner({ variables: { input: processedBanner } });
  };

  const removeIdAndTypename = (action: CreateBannerActionInput) => {
    const { id, __typename, ...actionCleaned } = action as any;
    return actionCleaned;
  };

  const removeTypename = (page: any) => {
    const { __typename, ...pageCleaned } = page;
    return pageCleaned;
  };

  const handleAddAction = (action: CreateBannerActionInput) => {
    setBanner({
      ...banner,
      actions: [...(banner.actions || []), action],
    });
  };

  const handleRemoveAction = (index: number) => {
    setBanner({
      ...banner,
      actions: banner.actions?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <Form
      fluid
      formValue={banner}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
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

      <BannerForm
        create
        banner={banner}
        onChange={changes => setBanner(changes)}
        onAddAction={handleAddAction}
        onRemoveAction={handleRemoveAction}
      />
    </Form>
  );
};
