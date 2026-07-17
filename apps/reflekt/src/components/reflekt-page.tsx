import styled from '@emotion/styled';
import { css, GlobalStyles, Theme } from '@mui/material';
import { ContentWidthProvider } from '@wepublish/content/website';
import {
  TransactionFeeIcon,
  TransactionFeeWrapper,
} from '@wepublish/membership/website';
import { Page } from '@wepublish/page/website';
import { BuilderPageProps } from '@wepublish/website/builder';

import { FlexBlockHeroWrapper } from './block-layouts/flex-block-hero';
import { CollapsibleContentWrapper } from './break-blocks/reflekt-collapsible-content';
import { CollapsibleDownloadsWrapper } from './break-blocks/reflekt-collapsible-downloads';
import { ReflektLogo } from './reflekt-navbar';

const fullWidthMainSpacer = (theme: Theme) => css`
  main > .MuiContainer-root {
    max-width: initial;
    padding-left: 0;
    padding-right: 0;
  }
`;

const StyledReflektPage = styled(Page)`
  & > .MuiContainer-root {
    max-width: initial;
    grid-template-columns: minmax(
      auto,
      ${({ theme }) => theme.breakpoints.values['lg']}px
    );
    justify-content: center;
  }

  & > .MuiContainer-root:has(${FlexBlockHeroWrapper}) {
    grid-template-columns: 1fr;
    justify-content: stretch;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    ${CollapsibleContentWrapper} .MuiCollapse-root,
    ${CollapsibleDownloadsWrapper} .MuiCollapse-root,
    ${CollapsibleContentWrapper}
      .MuiAccordionSummary-root
      .MuiAccordionSummary-content,
    ${CollapsibleDownloadsWrapper}
      .MuiAccordionSummary-root
      .MuiAccordionSummary-content {
      grid-column: 2 / 12;

      ${({ theme }) => theme.breakpoints.up('xs')} {
        margin-left: 0;
      }

      ${({ theme }) => theme.breakpoints.up('lg')} {
        margin-left: 2rem;
      }
    }

    ${CollapsibleContentWrapper} .MuiAccordionSummary-expandIconWrapper,
    ${CollapsibleDownloadsWrapper} .MuiAccordionSummary-expandIconWrapper {
      grid-column: 2 / 12;

      ${({ theme }) => theme.breakpoints.up('xs')} {
        margin-right: 0;
      }

      ${({ theme }) => theme.breakpoints.up('lg')} {
        margin-right: 2rem;
      }
    }
  }

  &.secondary-background {
    background-color: ${({ theme }) => theme.palette.secondary.main};
    padding-bottom: ${({ theme }) => theme.spacing(10)};
  }
`;

const secondaryBackgroundStyles = (theme: Theme) => css`
  :root {
    ${theme.breakpoints.up('md')} {
      --navbar-bg-color-hero-off-screen: ${theme.palette.secondary.main};
    }
  }

  body {
    background-color: ${theme.palette.secondary.main};

    ${ReflektLogo} {
      mix-blend-mode: normal;
      filter: invert(1);
    }

    ${TransactionFeeWrapper} {
      border: 1px solid #d32f2f;
    }

    ${TransactionFeeIcon} {
      border-top: 1px solid #d32f2f;
    }
  }
`;

const pageGlobalStyles = <GlobalStyles styles={fullWidthMainSpacer} />;
const secondaryBackgroundGlobalStyles = (
  <GlobalStyles styles={secondaryBackgroundStyles} />
);
export const ReflektPage = (props: BuilderPageProps) => {
  const secondaryBackground =
    props.data?.page?.latest?.properties?.find(
      p => p.key === 'secondaryBackground'
    )?.value === 'true';

  return (
    <ContentWidthProvider fullWidth>
      {pageGlobalStyles}
      {secondaryBackground && secondaryBackgroundGlobalStyles}

      <StyledReflektPage
        {...props}
        className={[
          props.className,
          secondaryBackground && 'secondary-background',
        ]
          .filter(Boolean)
          .join(' ')}
      />
    </ContentWidthProvider>
  );
};
