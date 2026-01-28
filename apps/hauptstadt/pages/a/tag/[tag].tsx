export {
  TagPageGetStaticPaths as getStaticPaths,
  TagPageGetStaticProps as getStaticProps,
} from '@wepublish/utils/website';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { TagTitleWrapper } from '@wepublish/tag/website';
import { TagPage } from '@wepublish/utils/website';

export default styled(TagPage)`
  ${TagTitleWrapper} {
    grid-column: -1/1;
    grid-template-columns: minmax(0, 680px);
    justify-content: center;
    margin-top: ${({ theme }) => theme.spacing(2)};
  }

  ${TagTitleWrapper} p {
    ${({ theme }) => css(theme.typography.subtitle1)}
  }
`;