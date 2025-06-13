import styled from '@emotion/styled'
import {NoSsr, Typography} from '@mui/material'
import {Article, ArticleInfoWrapper} from '@wepublish/article/website'
import {ImageBlockWrapper, TitleBlockWrapper} from '@wepublish/block-content/website'
import {createWithTheme} from '@wepublish/ui'
import {Article as ArticleType, useCommentListQuery} from '@wepublish/website/api'
import {Button} from '@wepublish/website/builder'
import {
  BuilderArticleAuthorsProps,
  BuilderArticleMetaProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {Fragment, useState} from 'react'
import {FaCommentSlash, FaRegComment, FaShare} from 'react-icons/fa6'
import {MdFormatSize, MdPrint} from 'react-icons/md'

import {contentTheme} from '../theme'
import {FontSizePicker} from './font-size-picker'

export const HauptstadtArticle = createWithTheme(
  styled(Article)`
    gap: var(--article-content-row-gap);

    // Swap Image & Title position
    > ${ImageBlockWrapper}:first-of-type + ${TitleBlockWrapper}:first-of-type {
      grid-row-start: 2;
    }

    /* In case no image block exists */
    ${TitleBlockWrapper}:first-of-type + ${ImageBlockWrapper},
    ${ImageBlockWrapper}:first-of-type + ${TitleBlockWrapper} {
      ~ ${ArticleInfoWrapper} {
        grid-row-start: 3;
      }
    }

    ${ArticleInfoWrapper} {
      grid-row-start: 2;
      gap: ${({theme}) => theme.spacing(1)};
    }
  `,
  contentTheme
)

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

export const HauptstadtArticleMetaWrapper = styled('div')`
  display: flex;
  flex-flow: row wrap;

  .MuiButton-startIcon {
    margin-right: ${({theme}) => theme.spacing(0.5)};
  }
`

const MetaWrapperButton = styled(Button)`
  padding-top: 0;
  color: ${({theme}) => theme.palette.common.black};
`

const MetaWrapperTypography = styled(Typography)`
  text-decoration: underline;
`

export const HauptstadtArticleMeta = ({article, className}: BuilderArticleMetaProps) => {
  const [openFontSizeModal, setOpenFontSizeModal] = useState(false)
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
  const canShare = typeof window !== 'undefined' && 'share' in navigator

  return (
    <>
      <HauptstadtArticleMetaWrapper className={className}>
        <MetaWrapperButton
          color="primary"
          variant="text"
          size="medium"
          LinkComponent={Link}
          href="#comments"
          startIcon={
            article.disableComments ? <FaCommentSlash size={16} /> : <FaRegComment size={16} />
          }>
          <MetaWrapperTypography variant="articleAuthors">
            {!commentCount
              ? 'Keine Beiträge'
              : `${commentCount} ${commentCount === 1 ? 'Beitrag' : 'Beiträge'}`}
          </MetaWrapperTypography>
        </MetaWrapperButton>

        {canShare && (
          <NoSsr>
            <MetaWrapperButton
              color="primary"
              variant="text"
              size="medium"
              startIcon={<FaShare size={16} />}
              onClick={async () => {
                navigator.share({
                  url: window.location.href,
                  title: article.latest.title ?? undefined,
                  text: article.latest.lead ?? undefined
                })
              }}>
              <MetaWrapperTypography variant="articleAuthors">Teilen</MetaWrapperTypography>
            </MetaWrapperButton>
          </NoSsr>
        )}

        <MetaWrapperButton
          color="primary"
          variant="text"
          size="medium"
          startIcon={<MdPrint size={16} />}
          onClick={() => print()}>
          <MetaWrapperTypography variant="articleAuthors">Drucken</MetaWrapperTypography>
        </MetaWrapperButton>

        <MetaWrapperButton
          color="primary"
          variant="text"
          size="medium"
          startIcon={<MdFormatSize size={16} />}
          onClick={() => setOpenFontSizeModal(true)}>
          <MetaWrapperTypography variant="articleAuthors">Schrift</MetaWrapperTypography>
        </MetaWrapperButton>
      </HauptstadtArticleMetaWrapper>

      <FontSizePicker
        open={openFontSizeModal}
        onCancel={() => setOpenFontSizeModal(false)}
        onSubmit={() => setOpenFontSizeModal(false)}
      />
    </>
  )
}
