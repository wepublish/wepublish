import styled from '@emotion/styled';
import { css, GlobalStyles, Theme } from '@mui/material';
import { ContentWidthProvider } from '@wepublish/content/website';
import { Page } from '@wepublish/page/website';
import { BuilderPageProps } from '@wepublish/website/builder';

const fullWidthMainSpacer = (theme: Theme) => css`
  main > .MuiContainer-root {
    max-width: initial;
    padding: 0;
  }
`;

const StyledReflektPage = styled(Page)`
  padding-top: var(--navbar-height);

  & > .MuiContainer-root {
    max-width: initial;
    grid-template-columns: minmax(
      auto,
      ${({ theme }) => theme.breakpoints.values['lg']}px
    );
    justify-content: center;
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
