import {styled} from '@mui/material'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, Block} from '@wepublish/website/api'
import {ArticleListWrapper} from './article-list/article-list'
import {CommentListWrapper} from '@wepublish/comments/website'
import {ContentWrapper} from '@wepublish/content/website'
import {
  AuthorChipImageWrapper,
  avatarImageStyles
} from '../../../../../apps/onlinereports/src/components/author-chip'
import {AuthorChipName} from '@wepublish/author/website'

export const ArticleWrapper = styled(ContentWrapper)`
  ${({theme}) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }
`

export const ArticleInfoWrapper = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
  grid-row-start: 3;
`

export const ArticleTags = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
`

export const ArticleAuthors = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1.5)};
  grid-template-areas:
    'images names'
    'images date';
  grid-template-columns: min-content auto;
  row-gap: 0;
`

const PreTitle = styled('div')`
  color: ${({theme}) => theme.palette.accent.contrastText};
  margin-top: ${({theme}) => theme.spacing(3.5)};
  margin-bottom: -${({theme}) => theme.spacing(3.5)};
  align-self: end;
`

export function Article({className, data, children, loading, error}: BuilderArticleProps) {
  const {
    AuthorChip,
    ArticleSEO,
    ArticleDate,
    elements: {Link, Image},
    blocks: {Blocks}
  } = useWebsiteBuilder()

  const article = data?.article
  const authors = article?.authors.filter(author => !author.hideOnArticle) || []

  return (
    <>
      <ArticleWrapper className={className}>
        <PreTitle>{article?.preTitle}</PreTitle>
        {article && <ArticleSEO article={data.article as ArticleType} />}

        <Blocks blocks={(article?.blocks as Block[]) ?? []} type="Article" />

        <ArticleInfoWrapper>
          <ArticleAuthors>
            <div style={{display: 'flex', gap: '12px', gridArea: 'images'}}>
              {authors?.map(author => (
                <>
                  {author.image && (
                    <AuthorChipImageWrapper>
                      <Image image={author.image} square css={avatarImageStyles} maxWidth={200} />
                    </AuthorChipImageWrapper>
                  )}
                </>
              ))}
            </div>
            <div
              style={{display: 'flex', gap: '4px', rowGap: 0, gridArea: 'names', alignSelf: 'end'}}>
              {authors?.map(author => (
                <AuthorChipName>
                  <Link href={author.url}>{author.name}</Link>
                </AuthorChipName>
              ))}
            </div>
            <div style={{gridArea: 'date'}}>
              <ArticleDate article={article as ArticleType} />
            </div>
          </ArticleAuthors>

          {/*{!!article?.tags.length && (*/}
          {/*  <ArticleTags>*/}
          {/*  {article.tags.map(tag => (*/}
          {/*      <Chip*/}
          {/*        key={tag.id}*/}
          {/*        label={tag.tag}*/}
          {/*        component={Link}*/}
          {/*        href={tag.url}*/}
          {/*        color="primary"*/}
          {/*        variant="outlined"*/}
          {/*        clickable*/}
          {/*      />*/}
          {/*    ))}*/}
          {/*  </ArticleTags>*/}
          {/*)}*/}
        </ArticleInfoWrapper>

        {children}
      </ArticleWrapper>
    </>
  )
}
