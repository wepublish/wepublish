import styled from '@emotion/styled'
import {Badge, Typography} from '@mui/material'
import {ArticleContainer, ArticleInfoWrapper} from '@wepublish/article/website'
import {TitleBlockWrapper} from '@wepublish/block-content/website'
import {Article as ArticleType, useCommentListQuery} from '@wepublish/website/api'
import {
  BuilderArticleAuthorsProps,
  BuilderArticleMetaProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {Fragment} from 'react'
import {FaCommentSlash, FaRegComment} from 'react-icons/fa6'

export const HauptstadtArticle = styled(ArticleContainer)`
  > ${TitleBlockWrapper}:first-child {
    grid-row-start: 2;
  }

  ${ArticleInfoWrapper} {
    grid-row-start: 3;
    gap: ${({theme}) => theme.spacing(1)};
  }
`

const HauptstadtArticleAuthorsWrapper = styled('div')`
  padding-bottom: ${({theme}) => theme.spacing(0.5)};
  border-bottom: 1px solid ${({theme}) => theme.palette.primary.main};
`

export const HauptstadtArticleAuthors = ({article, className}: BuilderArticleAuthorsProps) => {
  const {AuthorChip, ArticleDate} = useWebsiteBuilder()
  const authors = article?.latest.authors.filter(author => !author.hideOnArticle) || []

  if (!authors.length) {
    return
  }

  return (
    <Typography
      variant="articleAuthors"
      component={HauptstadtArticleAuthorsWrapper}
      className={className}>
      {authors.length && (
        <>
          Von{' '}
          {authors.map((author, index) => (
            <Fragment key={author.id}>
              <AuthorChip author={author} />
              {index !== authors.length - 1 ? ' und ' : ', '}
            </Fragment>
          ))}
        </>
      )}

      <ArticleDate article={article as ArticleType} />
    </Typography>
  )
}

export const ArticleMetaWrapper = styled('div')`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  gap: ${({theme}) => theme.spacing(2)};
`

export const ArticleMetaComments = styled('div')`
  margin-right: ${({theme}) => theme.spacing(2)};
`

const ArticleMetaBadge = styled(Badge)`
  .MuiBadge-badge {
    right: -3px;
    top: 11px;
    border: 2px solid ${({theme}) => theme.palette.background.paper};
    background: ${({theme}) => theme.palette.primary.main};
    color: ${({theme}) => theme.palette.primary.contrastText};
  }
`

export const HauptstadtArticleMeta = ({article, className}: BuilderArticleMetaProps) => {
  const {
    elements: {Link}
  } = useWebsiteBuilder()
  const {data} = useCommentListQuery({
    fetchPolicy: 'cache-only',
    variables: {
      itemId: article.id
    }
  })

  const commentCount = data?.comments.length

  return (
    <ArticleMetaWrapper className={className}>
      <ArticleMetaComments>
        <Link href="#comments" color="inherit">
          <ArticleMetaBadge
            max={99}
            showZero
            badgeContent={commentCount}
            invisible={!!article.disableComments}>
            {article.disableComments ? <FaCommentSlash size={24} /> : <FaRegComment size={24} />}
          </ArticleMetaBadge>
        </Link>
      </ArticleMetaComments>
    </ArticleMetaWrapper>
  )
}
