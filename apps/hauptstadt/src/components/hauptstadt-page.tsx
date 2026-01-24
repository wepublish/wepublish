import styled from '@emotion/styled';
import {
  ImageBlockWrapper,
  TitleBlockWrapper,
} from '@wepublish/block-content/website';
import { Page } from '@wepublish/page/website';
import { createWithTheme } from '@wepublish/ui';
import { BuilderPageProps } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { memo } from 'react';

import { useRedirectToLandingPage } from '../hooks/use-redirect-to-landing';
import { pageTheme } from '../theme';
import { breakoutContainerOnXs } from '../utils/breakout-container';

const PageWithLandingPageRedirect = memo(function WithLandingPageRedirect(
  props: BuilderPageProps
) {
  const router = useRouter();
  const [redirect, landingPageUrl] = useRedirectToLandingPage(props.data?.page);

  if (redirect) {
    router.replace(landingPageUrl);
  }

  return <Page {...props} />;
});

export const HauptstadtPage = createWithTheme(
  styled(PageWithLandingPageRedirect)`
    > ${TitleBlockWrapper}:first-child {
      margin-top: ${({ theme }) => theme.spacing(1)};
    }

    > ${ImageBlockWrapper}:first-of-type img {
      // only breakout the image so that the caption is still aligned
      ${breakoutContainerOnXs}
    }
  `,
  pageTheme
);
