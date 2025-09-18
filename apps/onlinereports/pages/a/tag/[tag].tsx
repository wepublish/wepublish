import styled from '@emotion/styled'
import {TagPage} from '@wepublish/utils/website'
import {ComponentProps} from 'react'

const TagArticleListWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({theme}) => theme.spacing(2.5)};
  margin-top: ${({theme}) => theme.spacing(4)};
`

export default function Tags(props: ComponentProps<typeof TagPage>) {
  return (
    <TagArticleListWrapper>
      <TagPage {...props} />
    </TagArticleListWrapper>
  );
}

export {
  TagPageGetStaticPaths as getStaticPaths,
  TagPageGetStaticProps as getStaticProps,
} from '@wepublish/utils/website';
