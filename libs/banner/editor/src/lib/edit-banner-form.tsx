import { useMutation } from '@apollo/client/react';
import { BannerDocument, UpdateBannerDocument } from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { useParams } from 'react-router-dom';

import { fromBanner, toBannerInput } from './banner.schema';
import { bannerView } from './banner.view';

type EditBannerViewProps = {
  bannerId: string;
};

export const EditBannerView = ({ bannerId }: EditBannerViewProps) => {
  const load = useQueryLoader(BannerDocument, { id: bannerId }, data =>
    fromBanner(data.banner)
  );
  const [updateBanner] = useMutation(UpdateBannerDocument);
  const banner = useEditForm(bannerView, {
    title: 'banner.edit.title',
    load,
    save: values =>
      updateBanner({
        variables: { input: { ...toBannerInput(values), id: bannerId } },
      }),
  });

  return <FormPage controller={banner} />;
};

export const EditBannerForm = () => {
  const { id } = useParams();

  return (
    <EditBannerView
      key={id}
      bannerId={id!}
    />
  );
};
