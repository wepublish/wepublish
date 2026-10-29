import { useQuery } from '@apollo/client/react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { createUsePuck } from '@puckeditor/core';
import { ImageDocument, PeerProfileDocument } from '@wepublish/editor/api';
import {
  getSeoPreviewData,
  GooglePreview,
  SeoContentType,
  SeoPreviewInfo,
  SocialPreviews,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { RootMetadata } from '../seo/seo.field';
import { toSeoPreviewMetadata } from './seo-preview-metadata';

const usePuck = createUsePuck();

const useImage = (id?: string) => {
  const { data } = useQuery(ImageDocument, {
    variables: { id: id ?? '' },
    skip: !id,
  });

  return id ? (data?.image ?? undefined) : undefined;
};

export function SeoPreview() {
  const { t } = useTranslation();
  const rootProps = usePuck(
    puck => puck.appState.data.root.props as RootMetadata | undefined
  );
  const { data: peerProfile } = useQuery(PeerProfileDocument);
  const profile = peerProfile?.peerProfile;

  const image = useImage(rootProps?.imageId);
  const socialMediaImage = useImage(rootProps?.socialMediaImageId);

  const previewData = getSeoPreviewData(
    SeoContentType.Page,
    toSeoPreviewMetadata(
      rootProps,
      { image, socialMediaImage },
      profile?.websiteURL
    ),
    {},
    profile?.name
  );

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h5"
          component="div"
          sx={{ fontWeight: 600 }}
        >
          {t('', 'SEO Preview')}
        </Typography>
      </Box>

      <Divider />

      <Stack
        spacing={3}
        sx={{ p: 2 }}
      >
        <SeoPreviewInfo />

        <GooglePreview
          data={previewData}
          siteName={profile?.name}
          favicon={profile?.squareLogo ?? profile?.logo}
        />

        <SocialPreviews data={previewData} />
      </Stack>
    </>
  );
}
