import { useMutation, useQuery } from '@apollo/client/react';
import React from 'react';
import {
  BannerDocument,
  CreateBannerActionInput,
  FullImageFragment,
  LoginStatus,
  UpdateBannerDocument,
  UpdateBannerInput,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { BannerForm } from './banner-form';
import { SingleViewTitle } from '@wepublish/ui/editor';
import { Form, Schema } from 'rsuite';

export const EditBannerForm = () => {
  const { id } = useParams();
  const bannerId = id!;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closePath = '/banners';

  const [banner, setBanner] = useState<
    UpdateBannerInput & { image?: FullImageFragment | null }
  >({
    id: bannerId,
    title: '',
    text: '',
    active: false,
    collapsible: true,
    hideForMinutes: 24 * 60,
    delay: 0,
    showOnArticles: false,
    showForLoginStatus: LoginStatus.All,
    //tags: []
  });

  const { data: bannerData } = useQuery(BannerDocument, {
    variables: {
      id: id!,
    },
    skip: !id,
  });

  useEffect(() => {
    if (bannerData) {
      setBanner({ imageId: bannerData.banner.image?.id, ...bannerData.banner });
    }
  }, [bannerData]);

  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    title: StringType().isRequired(t('errorMessages.required')),
    text: StringType().isRequired(t('errorMessages.required')),
  });

  const [shouldClose, setShouldClose] = useState(false);

  const [updateBanner, { loading }] = useMutation(UpdateBannerDocument, {
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
    updateBanner({ variables: { input: processedBanner } });
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
        title={t('banner.edit.title')}
        loadingTitle={t('banner.edit.title')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <BannerForm
        banner={banner}
        onChange={changes => setBanner({ ...changes, id: banner.id })}
        onAddAction={handleAddAction}
        onRemoveAction={handleRemoveAction}
      />
    </Form>
  );
};
