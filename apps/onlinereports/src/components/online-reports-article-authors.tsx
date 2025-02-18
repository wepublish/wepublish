import {AuthorChipImageWrapper, avatarImageStyles} from './author-chip'
import {AuthorChipName, BuilderArticleAuthorsProps, useWebsiteBuilder} from '@wepublish/website'
import {styled} from '@mui/material'

export const ArticleAuthorsWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1.5)};
  grid-template-areas:
    'images names'
    'images date';
  grid-template-columns: min-content auto;
  row-gap: 0;
`

const AuthorNames = styled('div')`
  grid-area: names;
  display: flex;
  flex-wrap: wrap;
  align-self: end;
  gap: 4px;
  row-gap: 0;

  ${AuthorChipName} {
    :after {
      content: ', ';
    }
    &:last-of-type:after {
      content: '';
    }
    a {
      color: ${({theme}) => theme.palette.text.primary};
      text-decoration: none;
      font-weight: 500;
    }
  }
`

export function OnlineReportsArticleAuthors({article}: BuilderArticleAuthorsProps) {
  const {
    ArticleDate,
    elements: {Image, Link}
  } = useWebsiteBuilder()

  const authors = article?.authors.filter(author => !author.hideOnArticle) || []
  if (!authors.length) {
    return
  }

  return (
    <ArticleAuthorsWrapper>
      <div style={{display: 'flex', gap: '12px', gridArea: 'images'}}>
        {authors?.map(author => (
          <>
            {author.image && (
              <AuthorChipImageWrapper key={author.id}>
                <Image image={author.image} square css={avatarImageStyles} maxWidth={200} />
              </AuthorChipImageWrapper>
            )}
          </>
        ))}
      </div>
      <AuthorNames>
        {authors?.map(author => (
          <AuthorChipName key={author.id}>
            <Link href={author.url}>{author.name}</Link>
          </AuthorChipName>
        ))}
      </AuthorNames>
      <div style={{gridArea: 'date'}}>
        <ArticleDate article={article} />
      </div>
    </ArticleAuthorsWrapper>
  )
}
