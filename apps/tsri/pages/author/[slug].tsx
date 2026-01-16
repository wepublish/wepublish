import { css, Global } from '@emotion/react';
import { AuthorPage } from '@wepublish/utils/website';

import theme from '../../src/theme';

export default function TsriAuthorPage(
  props: Parameters<typeof AuthorPage>[0]
) {
  return (
    <>
      <Global
        styles={css`
          .tsri-author-page {
            & > h2.MuiTypography-root {
              background-color: ${theme.palette.common.black};
              color: ${theme.palette.common.white};
              border-top-left-radius: 0.8rem;
              border-top-right-radius: 0.8rem;
              padding: 0.33rem 1rem;
              font-size: 1rem !important;
              line-height: 1.5rem !important;
              grid-column: -1 / 1;
              margin-bottom: ${theme.spacing(-5)};
            }
          }
        `}
      />
      <AuthorPage
        {...props}
        className="tsri-author-page"
      />
    </>
  );
}

export {
  getAuthorStaticPaths as getStaticPaths,
  getAuthorStaticProps as getStaticProps,
} from '@wepublish/utils/website';
