import styled from '@emotion/styled';
import { css, GlobalStyles, Theme } from '@mui/material';
import { ContentWidthProvider } from '@wepublish/content/website';
import { Page } from '@wepublish/page/website';
import { BuilderPageProps } from '@wepublish/website/builder';

import { FlexBlockHeroWrapper } from './block-layouts/flex-block-hero';

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
`;

const pageGlobalStyles = <GlobalStyles styles={fullWidthMainSpacer} />;
export const ReflektPage = (props: BuilderPageProps) => {
  return (
    <ContentWidthProvider fullWidth>
      {pageGlobalStyles}

      <StyledReflektPage {...props} />
    </ContentWidthProvider>
  );
};
