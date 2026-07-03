import styled from '@emotion/styled';
import { css, GlobalStyles, Theme } from '@mui/material';
import { ContentWidthProvider } from '@wepublish/content/website';
import { Page } from '@wepublish/page/website';
import { BuilderPageProps } from '@wepublish/website/builder';

import { FlexBlockHeroWrapper } from './block-layouts/flex-block-hero';
import { CollapsibleContentWrapper } from './break-blocks/reflekt-collapsible-content';
import { CollapsibleDownloadsWrapper } from './break-blocks/reflekt-collapsible-downloads';

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

  &.hide-amount-slider [data-area='monthlyAmount'] {
    display: none;
  }
`;

const pageGlobalStyles = <GlobalStyles styles={fullWidthMainSpacer} />;
export const ReflektPage = (props: BuilderPageProps) => {
  const hideAmountSlider =
    props.data?.page?.latest?.properties?.find(
      p => p.key === 'hideAmountSlider'
    )?.value === 'true';

  return (
    <ContentWidthProvider fullWidth>
      {pageGlobalStyles}

      <StyledReflektPage
        {...props}
        className={[props.className, hideAmountSlider && 'hide-amount-slider']
          .filter(Boolean)
          .join(' ')}
      />
    </ContentWidthProvider>
  );
};
