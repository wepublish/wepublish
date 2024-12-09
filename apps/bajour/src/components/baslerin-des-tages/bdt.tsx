import {ApiV1, isRichTextBlock, RichTextBlock, useWebsiteBuilder} from '@wepublish/website'
import {SliderArticle} from './baslerin-des-tages'
import {useState} from 'react'
import {format} from 'date-fns'
import {useKeenSlider} from 'keen-slider/react'

import 'keen-slider/keen-slider.min.css'
import {styled} from '@mui/material'
import {useLikeStatus} from './use-like-status'

const SLIDER_SPACING = 24
const SLIDER_WIDTH = 120
const SLIDER_MAIN_WIDTH = 320
const SLIDER_HEIGHT = 150
const SLIDER_MAIN_HEIGHT = 390
const SLIDER_DOWN_SHIFT = 120

const Container = styled('div')`
  display: grid;
  grid-template-columns: calc(
      ${SLIDER_MAIN_WIDTH}px + ${SLIDER_WIDTH}px + (2 * ${SLIDER_SPACING}px)
    ) auto;
`

const HeaderContainer = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: -${SLIDER_DOWN_SHIFT}px;
  grid-column-start: 2;
  grid-column-end: 3;
`

const HeaderUnderline = styled('div')`
  height: ${({theme}) => theme.spacing(2)};
  grid-column-start: 1;
  grid-column-end: 3;
  margin-bottom: ${({theme}) => theme.spacing(3)};
  background-color: ${({theme}) => theme.palette.secondary.main};
`

const TitleContainer = styled('div')`
  grid-column-start: 1;
  grid-column-end: 2;
  font-size: 1.7;
`

const SearchContainer = styled('div')`
  grid-column-start: 2;
  grid-column-end: 3;
`

const SliderContainer = styled('div')`
  grid-column-start: 1;
  grid-column-end: 3;
  display: flex;
`

const TextContainer = styled('div')`
  grid-column-start: 2;
  grid-column-end: 3;
  max-width: 500px;
  margin-top: -80px;
`

const TextIntroduction = styled('div')``

const LikeButton = styled('div')`
  font-size: 2em;
  display: flex;
  align-items: center;
  padding-top: ${({theme}) => theme.spacing(2)};
  gap: 0.2em;
  cursor: pointer;
  span {
    font-size: 0.7em;
  }
`

const SlideItem = styled('div')<{mainImage?: boolean}>`
  cursor: pointer;
  min-height: unset !important;
  margin-top: ${props => (props.mainImage ? 0 : SLIDER_DOWN_SHIFT)}px;
  height: ${props => (props.mainImage ? SLIDER_MAIN_HEIGHT : SLIDER_HEIGHT)}px;

  min-width: ${props => (props.mainImage ? SLIDER_MAIN_WIDTH : SLIDER_WIDTH)}px;

  img {
    width: 100%;
    height: 100%;
    border-radius: 15px;
    object-fit: cover;
  }
`
const SlideTitle = styled('span')`
  position: absolute;
  font-weight: bold;
  bottom: 0.5em;
  left: 0.5em;
  right: 0.5em;
  color: white;
  text-transform: uppercase;
  font-size: 0.7em;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.58);
`

interface BaslerinDesTagesProps {
  article: SliderArticle
  className?: string
}

export function Bdt({article, className}: BaslerinDesTagesProps) {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  const [currentArticle, setCurrentArticle] = useState<SliderArticle>(article)
  const [mainIndex, setMainIndex] = useState<number>(1)
  const [sliderArticles, setSliderArticles] = useState<SliderArticle[]>([])
  const [skipCount, setSkipCount] = useState(0)
  const [updated, setUpdated] = useState<boolean>(false)

  const [sliderRef, sliderInstance] = useKeenSlider({
    mode: 'free-snap',
    slides: {
      perView: 'auto',
      spacing: SLIDER_SPACING
    },
    loop: true,
    slideChanged: slider => {
      const activeIndex = slider.track.details.rel
      setMainIndex(activeIndex + 1)
    }
  })

  // update slide distances after changing the main index.
  sliderInstance.current?.on('animationEnded', slider => {
    slider.update()
  })

  const {data: tagData, loading: tagLoading} = ApiV1.useTagQuery({
    variables: {
      tag: 'baslerin-des-tages',
      type: ApiV1.TagType.Article
    }
  })

  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)

  ApiV1.useFullArticleListQuery({
    skip: tagLoading || !!searchQuery,
    variables: {
      take: 20,
      skip: skipCount,
      order: ApiV1.SortOrder.Descending,
      filter: {
        tags: [tagData?.tags?.nodes.at(0)?.id ?? ''],
        publicationDateFrom: {
          comparison: ApiV1.DateFilterComparison.Lt,
          date: currentArticle?.publishedAt
        }
      }
    },
    onCompleted: data => {
      const articles = data.articles.nodes as SliderArticle[]
      setSliderArticles([article, ...articles])
    }
  })

  /**
   * Like Btn
   */
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

  const [removeLikeMutation] = ApiV1.useRemoveLikeMutation({
    variables: {
      input: {
        articleId: currentArticle?.id ?? ''
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

  const textBlock = (currentArticle?.blocks as ApiV1.Block[])?.find(isRichTextBlock)

  const publishedAt = currentArticle?.publishedAt
  const publicationDate = publishedAt ? format(new Date(publishedAt), 'd. MMM yyyy') : ''
  const publicationDay = publishedAt ? format(new Date(publishedAt), 'eeee') : ''

  if (!currentArticle?.title || !currentArticle.image || !textBlock?.richText) {
    return <></>
  }

  if (!sliderArticles.length) {
    return <div>loading</div>
  }

  return (
    <Container>
      <HeaderContainer>
        <TitleContainer>
          <h1>
            Basler*in <br /> des Tages
          </h1>
        </TitleContainer>
        <HeaderUnderline />
      </HeaderContainer>

      <SliderContainer ref={sliderRef} className="keen-slider">
        {sliderArticles.map((article, index) => (
          <SlideItem
            key={article.id}
            className={`keen-slider__slide number-slide${index}`}
            mainImage={mainIndex === index}>
            {article.image && (
              <>
                <Image image={article.image} />
                <SlideTitle>{article.title}</SlideTitle>
              </>
            )}
          </SlideItem>
        ))}
      </SliderContainer>

      <TextContainer>
        <TextIntroduction>
          {currentArticle.lead ? (
            <h2>{currentArticle.lead} </h2>
          ) : (
            <h2>
              {currentArticle.title}
              <span style={{fontSize: '1rem'}}>, weil ...</span>
            </h2>
          )}
        </TextIntroduction>
        <RichTextBlock richText={textBlock.richText} />

        <LikeButton onClick={handleLike}>
          {isLiked ? '❤️' : '🤍'} <span>{likes}</span>
        </LikeButton>
      </TextContainer>
    </Container>
  )
}
