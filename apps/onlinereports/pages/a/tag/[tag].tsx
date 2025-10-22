export {
  TagPageGetStaticPaths as getStaticPaths,
  TagPageGetStaticProps as getStaticProps,
} from '@wepublish/utils/website';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { ArticleListWrapper } from '@wepublish/article/website';
import { ContentWrapperStyled } from '@wepublish/content/website';
import { TagTitle, TagTitleWrapper, TagWrapper } from '@wepublish/tag/website';
import { TagPage as TagPageDefault } from '@wepublish/utils/website';
import { ComponentProps } from 'react';

const TagArticleListWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2.5)};
  margin-top: ${({ theme }) => theme.spacing(4)};

  ${ContentWrapperStyled} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      row-gap: ${({ theme }) => theme.spacing(3)};
      ${({ theme }) => theme.breakpoints.up('sm')} {
        gap: ${({ theme }) => theme.spacing(3)};
      }
    }
  }
`;

export const TagPage = styled(TagPageDefault)`
  ${TagWrapper} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      gap: ${({ theme }) => theme.spacing(1.5)};
      background-color: cyan;
    }
  }

  ${TagTitleWrapper} {
    grid-column: -1/1;
    margin-top: ${({ theme }) => theme.spacing(1)};

    ${TagTitle} {
      ${({ theme }) => css(theme.typography.h1)}
    }
  }

  ${TagTitleWrapper} p {
    ${({ theme }) => css(theme.typography.subtitle1)}
  }

  ${ArticleListWrapper} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: -1/1;
    }
  }
`;

export default function Tags(props: ComponentProps<typeof TagPageDefault>) {
  return (
    <TagArticleListWrapper>
      <TagPage {...props} />
    </TagArticleListWrapper>
  );
}
