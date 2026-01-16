import { css, Global } from '@emotion/react';
import { TagPage } from '@wepublish/utils/website';

import theme from '../../../src/theme';

export default function TsriTagPage(props: Parameters<typeof TagPage>[0]) {
  return (
    <>
      <Global
        styles={css`
          .tsri-tag-page {
            padding-top: ${theme.spacing(1.5)};
          }
        `}
      />
      <TagPage
        {...props}
        className="tsri-tag-page"
      />
    </>
  );
}

export {
  TagPageGetStaticPaths as getStaticPaths,
  TagPageGetStaticProps as getStaticProps,
} from '@wepublish/utils/website';
