import styled from '@emotion/styled'
import {AuthorChipImageWrapper, AuthorChipName, avatarImageStyles} from './author-chip'
import {BuilderArticleAuthorsProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useCommentListQuery} from '@wepublish/website/api'
import {MdOutlineModeComment} from 'react-icons/md'
import {ArticleDateWrapper} from '@wepublish/article/website'
import {CommentListItemShareWrapper} from '@wepublish/comments/website'
import {Button} from '@mui/material'

export const ArticleAuthorsWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1.5)};
  grid-template-areas:
    'images names'
    'images date';
  grid-template-columns: min-content auto;
  row-gap: 0;
  flex-grow: 1;

  ${ArticleDateWrapper} {
    font-size: 14px;
  }
`

const AuthorAvatars = styled('div')`
  grid-area: images;
  display: flex;
  column-gap: ${({theme}) => theme.spacing(1.5)};
`

const AuthorNames = styled('div')`
  grid-area: names;
  display: flex;
  flex-wrap: wrap;
  align-self: end;
  row-gap: 0;
  font-size: 16px;

  ${AuthorChipName} {
    white-space: pre;

    a {
      color: ${({theme}) => theme.palette.text.primary};
      text-decoration: none;
      font-weight: 500;
      white-space: pre;
    }
  }
`

const MetaWrapper = styled('div')`
  display: flex;
  justify-items: stretch;
`

const CommentsShareBox = styled('div')`
  display: flex;
  gap: ${({theme}) => theme.spacing(0)};

  button {
    color: ${({theme}) => theme.palette.primary.main};
  }
`

const ShareButton = styled(Button)`
  font-weight: 300;
`

export function OnlineReportsArticleAuthors({article}: BuilderArticleAuthorsProps) {
  const {
    CommentListItemShare,
    ArticleDate,
    elements: {Image, Link}
  } = useWebsiteBuilder()

  const {
    data: {comments}
  } = useCommentListQuery({
    fetchPolicy: 'cache-only',
    variables: {
      itemId: article.id
    }
  })

  const authors = article?.latest.authors.filter(author => !author.hideOnArticle) || []
  if (!authors.length) {
    return
  }

  const scrollToComments = () => {
    const el = document.getElementById('comments')
    if (el) {
      el.scrollIntoView({behavior: 'smooth'})
    }
  }

  return (
    <MetaWrapper>
      <ArticleAuthorsWrapper>
        <AuthorAvatars>
          {authors?.map(author => (
            <>
              {author.image && (
                <AuthorChipImageWrapper key={author.id}>
                  <Image image={author.image} square css={avatarImageStyles} maxWidth={200} />
                </AuthorChipImageWrapper>
              )}
            </>
          ))}
        </AuthorAvatars>
        <AuthorNames>
          {authors?.map((author, i) => (
            <AuthorChipName key={author.id}>
              <Link href={author.url}>{author.name}</Link>
              {i < authors.length - 1 && ', '}
            </AuthorChipName>
          ))}
        </AuthorNames>
        <div style={{gridArea: 'date'}}>
          <ArticleDate article={article} />
        </div>
      </ArticleAuthorsWrapper>
      <CommentsShareBox>
        {!article?.disableComments && (
          <CommentListItemShareWrapper>
            <ShareButton onClick={scrollToComments} endIcon={<MdOutlineModeComment />}>
              {comments.length ? comments.length : ''}{' '}
            </ShareButton>
          </CommentListItemShareWrapper>
        )}
        <CommentListItemShare title={article.latest.title} url={article.url} />
      </CommentsShareBox>
    </MetaWrapper>
  )
}
