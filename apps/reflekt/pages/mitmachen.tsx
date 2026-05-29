import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { css, GlobalStyles } from '@mui/material';
import {
  TransactionFeeIcon,
  TransactionFeeWrapper,
} from '@wepublish/membership/website';
import { PageContainer } from '@wepublish/page/website';
import { SubscribePage } from '@wepublish/utils/website';
import { PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';
import { ComponentProps } from 'react';

import { ReflektLogo } from '../src/components/reflekt-navbar';

const MitmachenPage = styled(PageContainer)`
  background-color: ${({ theme }) => theme.palette.secondary.main};
  padding-bottom: ${({ theme }) => theme.spacing(10)};

  ${TransactionFeeWrapper} {
    border: 1px solid #d32f2f;
  }

  ${TransactionFeeIcon} {
    border-top: 1px solid #d32f2f;
  }
`;

export default function Mitmachen(props: ComponentProps<typeof SubscribePage>) {
  const theme = useTheme();

  return (
    <>
      <GlobalStyles
        styles={css`
          :root {
            ${theme.breakpoints.up('md')} {
              --navbar-bg-color-hero-off-screen: ${theme.palette.secondary
                .main};
            }
          }
          body {
            background-color: ${theme.palette.secondary.main};

            ${ReflektLogo} {
              mix-blend-mode: normal;
              filter: invert(1);
            }
          }
        `}
      />
      <MitmachenPage slug="mitmachen" />
    </>
  );
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
  return SubscribePage.getInitialProps(ctx, [
    {
      query: PageDocument,
      variables: { slug: 'mitmachen' },
    },
  ]);
};
