import styled from '@emotion/styled'
import {NoSsr, Typography} from '@mui/material'
import {ArticleContainer, ArticleInfoWrapper} from '@wepublish/article/website'
import {TitleBlockWrapper} from '@wepublish/block-content/website'
import {Article as ArticleType, useCommentListQuery} from '@wepublish/website/api'
import {
  BuilderArticleAuthorsProps,
  BuilderArticleMetaProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {Fragment, useState} from 'react'
import {FaCommentSlash, FaRegComment, FaShare} from 'react-icons/fa6'
import {MdFormatSize, MdPrint} from 'react-icons/md'

import {FontSizePicker} from './font-size-picker'

export const HauptstadtArticle = styled(ArticleContainer)`
  > ${TitleBlockWrapper}:first-of-type {
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

export const HauptstadtArticleMeta = ({article, className}: BuilderArticleMetaProps) => {
  const [openFontSizeModal, setOpenFontSizeModal] = useState(false)
  const {
    elements: {Link, Button}
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
      <ArticleMetaWrapper className={className}>
        <ArticleMetaComments>
          <Button
            color="primary"
            variant="text"
            LinkComponent={Link}
            href="#comments"
            startIcon={
              article.disableComments ? <FaCommentSlash size={16} /> : <FaRegComment size={16} />
            }>
            {!commentCount
              ? 'Keine Beiträge'
              : `${commentCount} ${commentCount === 1 ? 'Beitrag' : 'Beiträge'}`}
          </Button>

          {canShare && (
            <NoSsr>
              <Button
                color="primary"
                variant="text"
                startIcon={<FaShare size={16} />}
                onClick={async () => {
                  navigator.share({
                    url: article.url,
                    title: article.latest.title ?? undefined,
                    text: article.latest.lead ?? undefined
                  })
                }}>
                Teilen
              </Button>
            </NoSsr>
          )}

          <Button
            color="primary"
            variant="text"
            startIcon={<MdPrint size={16} />}
            onClick={() => print()}>
            Drucken
          </Button>

          <Button
            color="primary"
            variant="text"
            startIcon={<MdFormatSize size={16} />}
            onClick={() => setOpenFontSizeModal(true)}>
            Schrift
          </Button>
        </ArticleMetaComments>
      </ArticleMetaWrapper>

      <FontSizePicker
        open={openFontSizeModal}
        onCancel={() => setOpenFontSizeModal(false)}
        onSubmit={() => setOpenFontSizeModal(false)}
      />
    </>
  )
}
