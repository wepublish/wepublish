import {Article, ArticleAuthors, ArticleTags} from '@wepublish/website'
import {styled} from '@mui/material'

export const FdTArticle = styled(Article)`
  ${ArticleAuthors},
  ${ArticleTags} {
    display: none;
  }
`
