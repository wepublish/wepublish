import { Box, Divider, NoSsr, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  FaXTwitter,
  FaFacebook,
  FaDiscord,
  FaWhatsapp,
  FaGoogle,
} from 'react-icons/fa6';
import { DiscordPreview } from './discord';
import { FacebookPreview } from './facebook';
import { GoogleSearchPreview } from './google';
import { TwitterPreview } from './twitter';
import { WhatsAppPreview } from './whatsapp';
import { faker } from '@faker-js/faker';
import { createUsePuck } from '@puckeditor/core';
import { useImageQuery } from '@wepublish/editor/api';
import { useMemo } from 'react';

import { SEOValue } from '../seo/seo.field';

const SectionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

const PlatformIcon = styled(Box)<{ bgcolor: string }>(({ bgcolor }) => ({
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: bgcolor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
}));

const SectionTitle = styled(Typography)({
  fontSize: '20px',
  fontWeight: 600,
  color: '#1e293b',
});

const CardWrapper = styled(Box)({
  backgroundColor: '#ffffff',
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  display: 'inline-block',
});

const DiscordBackground = styled(Box)({
  backgroundColor: '#313338',
  borderRadius: 12,
  padding: 24,
  display: 'inline-block',
});

const WhatsAppBackground = styled(Box)({
  backgroundColor: '#efeae2',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23d9d4cb' fillOpacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm-22 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  borderRadius: 12,
  padding: 24,
  display: 'inline-block',
});

const placeholders = {
  url: faker.internet.url(),
  domain: faker.internet.domainName(),
  siteName: faker.internet.displayName(),
  title: faker.commerce.product(),
  description: faker.commerce.productDescription(),
  image: faker.image.urlPicsumPhotos(),
  favicon: faker.image.urlPicsumPhotos(),
};

const usePuck = createUsePuck();

type RootSEOProps = {
  seo?: SEOValue;
  socialMedia?: SEOValue;
};

export function SeoPreview() {
  const rootProps = usePuck(
    puck => puck.appState.data.root.props as RootSEOProps | undefined
  );

  // Social media shares use the social image, falling back to the SEO image
  const imageId = rootProps?.socialMedia?.imageId || rootProps?.seo?.imageId;
  const { data: imageData } = useImageQuery({
    variables: { id: imageId ?? '' },
    skip: !imageId,
  });
  const image = imageId ? imageData?.image : undefined;

  const sampleData = useMemo(() => {
    const seo = rootProps?.seo;
    const socialMedia = rootProps?.socialMedia;

    return {
      ...placeholders,
      image: image?.largeURL ?? image?.url ?? placeholders.image,
      // Google uses the search engine values, everything else the social ones
      searchTitle: seo?.title || socialMedia?.title || placeholders.title,
      searchDescription:
        seo?.lead || socialMedia?.lead || placeholders.description,
      title: socialMedia?.title || seo?.title || placeholders.title,
      description: socialMedia?.lead || seo?.lead || placeholders.description,
    };
  }, [rootProps?.seo, rootProps?.socialMedia, image]);

  return (
    <NoSsr>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h5"
          component={'div'}
          fontWeight={600}
        >
          Open Graph Preview
        </Typography>

        <Typography
          variant="body2"
          component={'div'}
          color="text.secondary"
        >
          See how your links appear when shared on different platforms
        </Typography>
      </Box>

      <Divider />

      <Stack
        spacing={7}
        sx={{ py: 2 }}
      >
        <Stack
          spacing={2}
          sx={{ px: 2 }}
        >
          <SectionHeader>
            <PlatformIcon bgcolor="#4285f4">
              <FaGoogle size={18} />
            </PlatformIcon>

            <SectionTitle>Google Search</SectionTitle>
          </SectionHeader>

          <CardWrapper>
            <GoogleSearchPreview
              url={sampleData.url}
              breadcrumbs={[sampleData.url, 'blog']}
              title={sampleData.searchTitle}
              description={sampleData.searchDescription}
              favicon={sampleData.favicon}
              siteName={sampleData.siteName}
            />
          </CardWrapper>
        </Stack>

        <Stack
          spacing={2}
          sx={{ px: 2 }}
        >
          <SectionHeader>
            <PlatformIcon bgcolor="#25d366">
              <FaWhatsapp size={22} />
            </PlatformIcon>
            <SectionTitle>WhatsApp</SectionTitle>
          </SectionHeader>

          <WhatsAppBackground>
            <WhatsAppPreview
              url={sampleData.url}
              domain={sampleData.domain}
              title={sampleData.title}
              description={sampleData.description}
              image={sampleData.image}
            />
          </WhatsAppBackground>
        </Stack>

        <Stack
          spacing={2}
          sx={{ px: 2 }}
        >
          <SectionHeader>
            <PlatformIcon bgcolor="#000000">
              <FaXTwitter size={20} />
            </PlatformIcon>

            <SectionTitle>X (formerly Twitter)</SectionTitle>
          </SectionHeader>

          <CardWrapper>
            <TwitterPreview
              url={sampleData.url}
              domain={sampleData.domain}
              title={sampleData.title}
              description={sampleData.description}
              image={sampleData.image}
            />
          </CardWrapper>
        </Stack>

        <Stack
          spacing={2}
          sx={{ px: 2 }}
        >
          <SectionHeader>
            <PlatformIcon bgcolor="#1877f2">
              <FaFacebook size={20} />
            </PlatformIcon>

            <SectionTitle>Facebook</SectionTitle>
          </SectionHeader>

          <CardWrapper>
            <FacebookPreview
              url={sampleData.url}
              domain={sampleData.domain}
              title={sampleData.title}
              description={sampleData.description}
              image={sampleData.image}
            />
          </CardWrapper>
        </Stack>

        <Stack
          spacing={2}
          sx={{ px: 2 }}
        >
          <SectionHeader>
            <PlatformIcon bgcolor="#5865f2">
              <FaDiscord size={20} />
            </PlatformIcon>

            <SectionTitle>Discord</SectionTitle>
          </SectionHeader>

          <DiscordBackground>
            <DiscordPreview
              siteName={sampleData.siteName}
              title={sampleData.title}
              description={sampleData.description}
              image={sampleData.image}
              color="#000000"
            />
          </DiscordBackground>

          <DiscordBackground>
            <DiscordPreview
              siteName={sampleData.siteName}
              title={sampleData.title}
              description={sampleData.description}
              image={sampleData.image}
              color="#000000"
              small
            />
          </DiscordBackground>
        </Stack>
      </Stack>
    </NoSsr>
  );
}
