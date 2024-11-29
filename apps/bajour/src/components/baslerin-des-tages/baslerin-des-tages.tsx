import {ApiV1, isRichTextBlock, RichTextBlock, SliderWrapper} from '@wepublish/website'
import {format} from 'date-fns'
import {useState} from 'react'
import {useLikeStatus} from './use-like-status'
import {Grid} from '@mui/material'
import styled from '@emotion/styled'

const SlideItem = styled.div`
  cursor: pointer;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const SlideTitle = styled.div`
  font-weight: bold;
  margin-top: 8px;
`

const StyledSliderWrapper = styled(SliderWrapper)<{gridArea: string}>`
  grid-area: ${props => props.gridArea};
`

const DateWrapper = styled.div<{gridArea: string}>`
  grid-area: ${props => props.gridArea};
  display: flex;
  flex-direction: column;
  span:first-child {
    font-weight: bold;
    border-bottom: 2px solid black;
  }
`

const ContentWrapper = styled.div<{gridArea: string}>`
  grid-area: ${props => props.gridArea};
`

interface SliderArticle extends Omit<ApiV1.Article, 'comments' | 'socialMediaAuthors'> {}

interface BaslerinDesTagesProps {
  article: SliderArticle
  className?: string
}

function ContentBlock(props: {
  preTitle: string | null | undefined
  title: string | null | undefined
  textBlock: ApiV1.RichTextBlock
}): JSX.Element {
  return (
    <>
      <section>
        <div style={{marginBottom: '1em'}}>
          {props.preTitle ? <span>{props.preTitle} </span> : <span>BASLER*IN des Tages ist </span>}
          <h2>{props.title}</h2>
          <span>, weil ...</span>
        </div>
        <div style={{maxWidth: '500px'}}>
          <RichTextBlock richText={props.textBlock.richText} />
        </div>
      </section>
    </>
  )
}

export function BaslerinDesTages({article, className}: BaslerinDesTagesProps) {
  const [currentArticle, setCurrentArticle] = useState<SliderArticle>(article)

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
  } = ApiV1.useFullArticleListQuery({
    skip: !tagData?.tags?.nodes.length,
    variables: {
      take: 6,
      order: ApiV1.SortOrder.Descending,
      filter: {
        tags: [tagData?.tags?.nodes.at(0)?.id ?? ''],
        publicationDateFrom: {
          comparison: ApiV1.DateFilterComparison.Lower,
          date: currentArticle?.publishedAt
        }
      }
    }
  })

  const [addLikeMutation] = ApiV1.useAddLikeMutation({
    variables: {
      input: {
        articleId: currentArticle?.id ?? ''
      }
    }
  })

  const [removeLikeMutation] = ApiV1.useRemoveLikeMutation({
    variables: {
      input: {
        articleId: currentArticle?.id ?? ''
      }
    }
  })

  const [likes, setLikes] = useState(currentArticle?.likes || 0)
  const {isLiked, updateLikeStatus} = useLikeStatus(currentArticle?.id ?? '')

  const handleLike = async () => {
    if (isLiked) {
      await removeLikeMutation()
      setLikes(prev => prev - 1)
      updateLikeStatus(false)
    } else {
      await addLikeMutation()
      setLikes(prev => prev + 1)
      updateLikeStatus(true)
    }
  }

  const textBlock = (currentArticle?.blocks as ApiV1.Block[]).find(isRichTextBlock)

  const publishedAt = currentArticle?.publishedAt
  const publicationDate = publishedAt ? format(new Date(publishedAt), 'd. MMM yyyy') : ''
  const publicationDay = publishedAt ? format(new Date(publishedAt), 'eeee') : ''

  if (!currentArticle?.title || !currentArticle.image || !textBlock?.richText) {
    return <></>
  }

  return (
    <div className={className}>
      <Grid>
        <StyledSliderWrapper gridArea="1 / 2 / 2 / 3">
          <img src={currentArticle.image.url ?? ''} alt={currentArticle.image.description ?? ''} />
        </StyledSliderWrapper>

        <StyledSliderWrapper gridArea="1 / 2 / 2 / 3">
          {articleData?.articles?.nodes && (
            <SliderWrapper>
              {articleData.articles.nodes.map(article => (
                <SlideItem key={article.id} onClick={() => setCurrentArticle(article)}>
                  {article.image && (
                    <>
                      <img src={article.image.url} alt={article.image.description || ''} />
                      <SlideTitle>{article.title}</SlideTitle>
                    </>
                  )}
                </SlideItem>
              ))}
            </SliderWrapper>
          )}
        </StyledSliderWrapper>

        <DateWrapper gridArea="2 / 2 / 3 / 3">
          <span>{publicationDay}</span>
          <span>{publicationDate}</span>
        </DateWrapper>

        <ContentWrapper gridArea="3 / 1 / 4 / 3">
          <ContentBlock
            preTitle={currentArticle.preTitle}
            title={currentArticle.title}
            textBlock={textBlock}
          />
        </ContentWrapper>
      </Grid>
    </div>
  )
}
