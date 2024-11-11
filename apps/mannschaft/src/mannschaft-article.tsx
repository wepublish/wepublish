import {styled} from '@mui/material'
import {Article, ArticleWrapper} from '@wepublish/website'
import {BuilderArticleProps} from '@wepublish/website'

import {MannschaftBlockRenderer} from './mannschaft-block-renderer'
import {createNewAdTeaser} from './mannschaft-blocks'

const MannschaftArticleWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};
`

export const MannschaftArticle = (props: BuilderArticleProps) => {
  return (
    <MannschaftArticleWrapper>
      <ArticleWrapper>
        <MannschaftBlockRenderer block={createNewAdTeaser()} count={1} index={0} type="Article" />
      </ArticleWrapper>

      <Article {...props} />

      <ArticleWrapper>
        <MannschaftBlockRenderer block={createNewAdTeaser()} count={1} index={0} type="Article" />
      </ArticleWrapper>
    </MannschaftArticleWrapper>
  )
}
