import styled from '@emotion/styled'
import {AuthorChipImageWrapper, AuthorChipName, avatarImageStyles} from './author-chip'
import {BuilderArticleAuthorsProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const ArticleAuthorsWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1.5)};
  grid-template-areas:
    'images names'
    'images date';
  grid-template-columns: min-content auto;
  row-gap: 0;
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

export function OnlineReportsArticleAuthors({article}: BuilderArticleAuthorsProps) {
  const {
    ArticleDate,
    elements: {Image, Link}
  } = useWebsiteBuilder()

  const authors = article?.latest.authors.filter(author => !author.hideOnArticle) || []
  if (!authors.length) {
    return
  }

  return (
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
  )
}
