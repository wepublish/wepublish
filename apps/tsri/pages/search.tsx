import { css, Global } from '@emotion/react';
import {
  SearchPage,
  SearchPageGetServerSideProps,
} from '@wepublish/utils/website';

export default function TsriSearchPage(
  props: Parameters<typeof SearchPage>[0]
) {
  return (
    <>
      <Global
        styles={css`
          .tsri-search-page {
            padding-top: calc(var(--navbar-height) / 2);
            & > h1.MuiTypography-root {
              display: none;
            }
          }
        `}
      />
      <SearchPage
        {...props}
        className="tsri-search-page"
      />
    </>
  );
}

export { SearchPageGetServerSideProps as getServerSideProps };
