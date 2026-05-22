import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { PageContainer } from '@wepublish/page/website';
import {
  getApiUrl,
  getSessionTokenProps,
  ssrAuthLink,
  SubscribePage,
} from '@wepublish/utils/website';
import { getV1ApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';
import { ComponentProps } from 'react';

import { EenewsPageShell } from '../src/components/eenews-page-shell';
import { eenewsColors } from '../src/theme';

const IntroShell = styled(EenewsPageShell)`
  padding-top: 36px;
  padding-bottom: 0;
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding-top: 24px;
    padding-bottom: 0;
  }
`;

const IntroTitle = styled(Typography)`
  display: block;
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 38px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${eenewsColors.accent};
`;

const BodyShell = styled(EenewsPageShell)`
  padding-top: 24px;
  padding-bottom: 80px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding-top: 18px;
    padding-bottom: 56px;
  }
`;

const BodyInner = styled('div')`
  max-width: 760px;
`;

const BodyParagraph = styled(Typography)`
  display: block;
  color: ${eenewsColors.text};
  margin: 0;
`;

export default function Mitmachen(props: ComponentProps<typeof SubscribePage>) {
  return (
    <>
      <IntroShell>
        <IntroTitle>Energiewende braucht Lesende.</IntroTitle>
      </IntroShell>

      <EenewsPageShell>
        <SubscribePage {...props} />
      </EenewsPageShell>

      <BodyShell>
        <PageContainer slug="mitmachen" />
      </BodyShell>
    </>
  );
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  const client = getV1ApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await Promise.all([
    client.query({
      query: PageDocument,
      variables: { slug: 'mitmachen' },
    }),
  ]);

  return SubscribePage.getInitialProps(ctx);
};
