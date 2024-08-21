import {styled} from '@mui/material'
import {ApiV1, ArticleList, isRichTextBlock, RichTextBlock} from '@wepublish/website'
import {useWebsiteBuilder} from '@wepublish/website'
import {format} from 'date-fns'
import {BajourTeaserGrid} from '../website-builder-styled/blocks/teaser-grid-styled'
import {
  AuthorsAndDate,
  ReadMoreButton,
  TeaserContentStyled,
  TeaserImgStyled,
  TeaserLeadStyled,
  TeaserPreTitleStyled,
  TeaserTitlesStyled,
  TitleLine
} from '../website-builder-overwrites/blocks/teaser-overwrite.style'
import {ColTeaser} from '../website-builder-overwrites/blocks/col-teaser'
import {useEffect, useState} from 'react'
import {useBajourStorage} from './bajour-storage'
import {LikeButton} from './like-button'

interface BaslerinDesTagesProps {
  article: ApiV1.ArticleQuery
}

const Headings = styled('div')`
  border-bottom: 1em solid #feddd2;
  margin-left: 3em;
  grid-column: 1/3;
  ${({theme}) => theme.breakpoints.up('lg')} {
    grid-column-start: 2;
    padding-bottom: 3em;
    margin-left: 1em;
  }
`

const HeadingsInner = styled('div')`
  ${({theme}) => theme.breakpoints.up('lg')} {
    display: flex;
    justify-content: space-between;
    max-width: 500px;
  }
`

const Heading = styled('h1')`
  margin: 0;
  display: block;
  font-size: 1.6em;
  line-height: 1.2em;
  font-weight: 500;
`

const Content = styled('section')`
  margin-left: 3em;
  margin-right: 2em;
  margin-top: 1em;
  grid-column: 1/3;
  ${({theme}) => theme.breakpoints.up('lg')} {
    margin-left: 1em;
    grid-column: 2/3;
  }
`

const HeadingLarge = styled(Heading)`
  font-size: 2em;
  line-height: 1.3em;
  text-transform: uppercase;
`

const BaslerinDesTagesWrapper = styled('article')`
  overflow-x: hidden;
`

const MobileGrid = styled('div')`
  display: grid;
  grid-template-columns: 50% 50%;
  grid-auto-rows: max-content;
  gap: 1em;
  ${({theme}) => theme.breakpoints.up('lg')} {
    display: none;
  }
`

const DesktopGrid = styled('div')`
  display: none;
  ${({theme}) => theme.breakpoints.up('lg')} {
    display: grid;
    grid-template-columns: 33% 67%;
    grid-auto-rows: max-content;
    gap: 1em;
    padding-left: 3em;
  }
`

const DateWeekdayContainer = styled('div')`
  display: flex;
  flex-direction: column;
`

const DateDisplay = styled('span')`
  display: block;
  border-bottom: 1px solid black;
  font-size: 0.8em;
  font-weight: 500;
  ${({theme}) => theme.breakpoints.up('lg')} {
    font-size: 1.3em;
    text-align: right;
  }
`

const WeekdayDisplay = styled(DateDisplay)`
  border: none;
`

const Title = styled('span')`
  font-size: 1.3em;
  font-weight: 700;
  margin-bottom: 1em;
`

const ImageWrapperMobile = styled('div')`
  display: grid;
  grid-template-columns: 45vw 55vw;
  grid-template-rows: 1fr 1fr;
  gap: 0.8em;
  margin-top: 1em;
  margin-left: 1em;
  overflow-x: hidden;
  width: 100vw;
`

const ArticleListDesktop = styled(ArticleList)`
  display: none;
  margin-top: 1em;
  margin-left: 1em;
  ${({theme}) => theme.breakpoints.up('lg')} {
    display: block;
    overflow-x: hidden;
  }
  ${BajourTeaserGrid} {
    padding: 0;
    grid-template-columns: repeat(6, 10vw);
    height: 10vw;

    & > * {
      grid-column: span 1 !important;
    }
  }
  ${ColTeaser} {
    margin: 0;
    height: 10vw;

    ${TeaserImgStyled} {
      height: 10vw;
      border-radius: 15px;
    }
    ${TeaserContentStyled} {
      background: transparent;
      grid-column: 2/12;
      padding: 0;

      ${TeaserTitlesStyled} {
        color: white;
        text-shadow: 1px 1px 4px #000;
        font-size: 0.8rem;
        text-transform: uppercase;
      }

      ${TeaserPreTitleStyled}, ${AuthorsAndDate}, ${ReadMoreButton}, ${TeaserLeadStyled}, ${TitleLine} {
        display: none;
      }
    }
  }
`

const ArticleListMobile = styled(ArticleListDesktop)`
  display: block;
  overflow-x: hidden;
  grid-template-columns: 1/7;
  margin: 0;
  ${BajourTeaserGrid} {
    grid-template-columns: repeat(6, 20vw);
    gap: 3vw;
    height: 15vw;

    ${ColTeaser} {
      margin: 0;
      height: 20vw;

      ${TeaserImgStyled} {
        height: 20vw;
        border-radius: 15px;
      }

      ${TeaserContentStyled} {
        background: transparent;
        grid-column: 2/23;
      }
    }
  }
`

function ContentBlock(props: {
  preTitle: string | null | undefined
  title: string | null | undefined
  textBlock: ApiV1.RichTextBlock
}): JSX.Element {
  return (
    <>
      <Content>
        <div style={{marginBottom: '1em'}}>
          {props.preTitle ? <span>{props.preTitle} </span> : <span>BASLER*IN des Tages ist </span>}
          <Title>{props.title}</Title>
          <span>, weil ...</span>
        </div>
        <div style={{maxWidth: '500px'}}>
          <RichTextBlock richText={props.textBlock.richText} />
        </div>
      </Content>
    </>
  )
}

export function BaslerinDesTages({article}: BaslerinDesTagesProps) {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  const {add, remove, exists} = useBajourStorage('liked-articles')
  const [likes, setLikes] = useState(article.article?.likes)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (article.article?.id) {
      setIsLiked(exists(article.article.id))
    }
  }, [article.article?.id, exists])

  const {data: tagData, loading: tagLoading} = ApiV1.useTagQuery({
    variables: {
      tag: 'baslerin-des-tages',
      type: ApiV1.TagType.Article
    }
  })

  const {
    data: articleData,
    loading: articleLoading,
    error: articleError
  } = ApiV1.useArticleListQuery({
    skip: !tagData?.tags?.nodes.length,
    variables: {
      take: 6,
      order: ApiV1.SortOrder.Descending,
      filter: {
        tags: [tagData?.tags?.nodes.at(0)?.id ?? ''],
        publicationDateFrom: {
          comparison: ApiV1.DateFilterComparison.Lower,
          date: article.article?.publishedAt
        }
      }
    }
  })

  const [addLikeMutation] = ApiV1.useAddLikeMutation({
    variables: {
      input: {
        articleId: article.article?.id ?? ''
      }
    }
  })

  const like = async () => {
    if (article.article) {
      const {data} = await addLikeMutation()
      setLikes(data?.addLike)
      add(article.article.id)
      setIsLiked(true)
    }
  }

  const [removeLikeMutation] = ApiV1.useRemoveLikeMutation({
    variables: {
      input: {
        articleId: article.article?.id ?? ''
      }
    }
  })

  const unlike = async () => {
    if (article.article) {
      const {data} = await removeLikeMutation()
      setLikes(data?.removeLike)
      remove(article.article.id)
      setIsLiked(false)
    }
  }

  const textBlock = (article.article?.blocks as ApiV1.Block[]).find(isRichTextBlock)

  const publishedAt = article.article?.publishedAt
  const publicationDate = publishedAt ? format(new Date(publishedAt), 'd. MMM yyyy') : ''
  const publicationDay = publishedAt ? format(new Date(publishedAt), 'eeee') : ''

  if (!article.article?.title || !article.article.image || !textBlock?.richText) {
    return <></>
  }

  return (
    <BaslerinDesTagesWrapper>
      <DesktopGrid>
        <Image
          style={{gridRow: '1/4'}}
          image={article.article.image}
          square
          css={{borderRadius: '15%'}}
        />

        <Headings>
          <HeadingsInner>
            <div>
              <HeadingLarge>Basler*in</HeadingLarge>
              <Heading>des Tages</Heading>
            </div>
            <DateWeekdayContainer>
              <DateDisplay>{publicationDate}</DateDisplay>
              <WeekdayDisplay>{publicationDay}</WeekdayDisplay>
            </DateWeekdayContainer>
          </HeadingsInner>
        </Headings>

        <ArticleListDesktop
          data={articleData}
          loading={articleLoading || tagLoading}
          error={articleError}
        />

        <div>
          <ContentBlock
            preTitle={article.article?.preTitle}
            title={article.article.title}
            textBlock={textBlock}
          />

          <Content>
            <LikeButton isLiked={isLiked} likes={likes} onLike={like} onUnlike={unlike} />
          </Content>
        </div>
      </DesktopGrid>

      <MobileGrid>
        <Headings>
          <HeadingsInner>
            <div>
              <HeadingLarge>Basler*in</HeadingLarge>
              <Heading>des Tages</Heading>
            </div>
          </HeadingsInner>
        </Headings>

        <ImageWrapperMobile>
          <Image image={article.article.image} square css={{borderRadius: '15%', gridRow: '1/3'}} />
          <ArticleListMobile data={articleData} loading={articleLoading} error={articleError} />

          <DateWeekdayContainer>
            <DateDisplay>{publicationDate}</DateDisplay>
            <WeekdayDisplay>{publicationDay}</WeekdayDisplay>
          </DateWeekdayContainer>
        </ImageWrapperMobile>

        <ContentBlock
          preTitle={article.article?.preTitle}
          title={article.article.title}
          textBlock={textBlock}
        />

        <Content>
          <LikeButton isLiked={isLiked} likes={likes} onLike={like} onUnlike={unlike} />
        </Content>
      </MobileGrid>
    </BaslerinDesTagesWrapper>
  )
}
