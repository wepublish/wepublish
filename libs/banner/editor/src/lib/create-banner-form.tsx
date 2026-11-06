import { useMutation } from '@apollo/client/react';
import { CreateBannerDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';

import { toBannerInput } from './banner.schema';
import { bannerView } from './banner.view';

export const CreateBannerForm = () => {
  const [createBanner] = useMutation(CreateBannerDocument);
  const banner = useCreateForm(bannerView, {
    title: 'banner.create.title',
    save: async values => {
      const { data } = await createBanner({
        variables: { input: toBannerInput(values) },
      });

      return data?.createBanner.id;
    },
  });

  return <FormPage controller={banner} />;
};
