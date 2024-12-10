import {
  ApiV1,
  CommentListItemShare,
  isRichTextBlock,
  RichTextBlock,
  useWebsiteBuilder
} from '@wepublish/website'
import {SliderArticle} from './baslerin-des-tages'
import {useEffect, useMemo, useRef, useState} from 'react'
import {format} from 'date-fns'
import {KeenSliderHooks, KeenSliderInstance, useKeenSlider} from 'keen-slider/react'

import 'keen-slider/keen-slider.min.css'
import {styled} from '@mui/material'
import {useLikeStatus} from './use-like-status'
import {SearchBar} from './search-bar'

const TAKE = 20

const SLIDER_SPACING = 24
const SLIDER_WIDTH = 120
const SLIDER_MAIN_WIDTH = 320
const SLIDER_HEIGHT = 150
const SLIDER_MAIN_HEIGHT = 390
const SLIDER_DOWN_SHIFT = 120

const Container = styled('div')`
  display: grid;
  grid-template-columns:
    calc(${SLIDER_MAIN_WIDTH}px + ${SLIDER_WIDTH}px + (2 * ${SLIDER_SPACING}px))
    auto;
`

const HeaderContainer = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: -${SLIDER_DOWN_SHIFT}px;
  grid-column-start: 2;
  grid-column-end: 3;
`

const TitleContainer = styled('div')`
  grid-column-start: 1;
  grid-column-end: 2;
  font-size: 1.7;
  font-size: 2.5em;
  line-height: 1.2;
  font-weight: bold;
`

const SearchContainer = styled('div')`
  grid-column-start: 2;
  grid-column-end: 3;
  text-align: end;
`

const UnderlineDate = styled('div')`
  text-decoration: underline;
`

const HeaderUnderline = styled('div')`
  height: ${({theme}) => theme.spacing(2)};
  grid-column-start: 1;
  grid-column-end: 3;
  margin-bottom: ${({theme}) => theme.spacing(3)};
  margin-top: ${({theme}) => theme.spacing(3)};
  background-color: ${({theme}) => theme.palette.secondary.main};
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

const BtnContainer = styled('div')`
  display: grid;
  grid-template-columns: min-content auto;
  gap: ${({theme}) => theme.spacing(1)};
  padding-top: ${({theme}) => theme.spacing(2)};
  font-size: 2em;
`

const LikeButton = styled('div')`
  display: flex;
  align-items: center;
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

type KeenSlider = KeenSliderInstance<object, object, KeenSliderHooks>

export function Bdt({article, className}: BaslerinDesTagesProps) {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  const [mainIndex, setMainIndex] = useState<number>(1)
  const [sliderArticles, setSliderArticles] = useState<SliderArticle[]>([])
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)
  const [skipCount, setSkipCount] = useState(0)

  const [phraseWithTagQuery] = ApiV1.usePhraseWithTagLazyQuery()
  const [getMoreArticles] = ApiV1.useFullArticleListLazyQuery()

  // update main image and load more articles
  const animationEnded = async (slider: KeenSlider) => {
    console.log('animation ended. update slider and load more articles')
    slider.update()
    await loadMoreArticles()
  }

  /**
   * Instanciate Keen Slider
   */
  const [sliderRef, keenSlider] = useKeenSlider({
    mode: 'free-snap',
    slides: {
      perView: 'auto',
      spacing: SLIDER_SPACING
    },
    loop: false,
    slideChanged: async slider => {
      // update main image
      const activeIndex = slider.track.details.rel
      setMainIndex(activeIndex + 1)
    },
    created: instance => {
      instance.on('animationEnded', animationEnded, false)
    },
    destroyed: instance => {
      instance.on('animationEnded', animationEnded, true)
    }
  })

  // update slider after changes have been made to the articles array
  useEffect(() => {
    keenSlider.current?.update()
  }, [sliderArticles])

  async function loadMoreArticles() {
    console.log(mainIndex, sliderArticles.length)
    // only load more, if at least 10 articles before end
    if (mainIndex + 10 < sliderArticles.length) {
      return
    }

    const endOfQueueArticle = sliderArticles[sliderArticles.length - 1]
    console.log(endOfQueueArticle, sliderArticles)

    if (searchQuery) {
      // Load more search results
      setSkipCount(prev => prev + TAKE)

      const {data} = await phraseWithTagQuery({
        variables: {
          take: TAKE,
          tag: 'baslerin-des-tages',
          query: searchQuery,
          skip: skipCount
        }
      })
    } else {
      // console.log('load more regular articles')
      // Load more articles from regular list
      const {data} = await getMoreArticles({
        variables: {
          take: TAKE,
          skip: 0,
          order: ApiV1.SortOrder.Descending,
          filter: {
            tags: [tagData?.tags?.nodes.at(0)?.id ?? ''],
            publicationDateFrom: {
              comparison: ApiV1.DateFilterComparison.Lt,
              date: endOfQueueArticle.publishedAt
            }
          }
        }
      })
      const articles = (data?.articles?.nodes as SliderArticle[]) ?? []
      setSliderArticles([...sliderArticles, ...articles])
    }
  }

  const {data: tagData, loading: tagLoading} = ApiV1.useTagQuery({
    variables: {
      tag: 'baslerin-des-tages',
      type: ApiV1.TagType.Article
    }
  })

  /**
   * Initial articles load
   */
  ApiV1.useFullArticleListQuery({
    skip: tagLoading || !!searchQuery,
    variables: {
      take: TAKE,
      skip: 0,
      order: ApiV1.SortOrder.Descending,
      filter: {
        tags: [tagData?.tags?.nodes.at(0)?.id ?? ''],
        publicationDateFrom: {
          comparison: ApiV1.DateFilterComparison.Lt,
          date: article?.publishedAt
        }
      }
    },
    onCompleted: data => {
      const articles = data.articles.nodes as SliderArticle[]
      // insert main article in second position
      setSliderArticles([...articles.slice(0, 1), article, ...articles.slice(1, articles.length)])
    }
  })

  // render main article
  const mainArticle = useMemo(() => {
    if (sliderArticles?.length < mainIndex) {
      return
    }
    return sliderArticles[mainIndex]
  }, [mainIndex, sliderArticles])

  /**
   * Search functionality
   */
  const handleSearch = async (query: string | undefined) => {
    console.log('handle search', query)
    setSearchQuery(query)
    if (!query) {
      return
    }
    keenSlider.current?.moveToIdx(0)
    const {data} = await phraseWithTagQuery({
      variables: {take: TAKE, tag: 'baslerin-des-tages', query}
    })
    const articles = data?.phraseWithTag?.articles?.nodes as SliderArticle[]
    if (articles.length > 0) {
      setSliderArticles(articles)
      setMainIndex(1)
    }
  }

  /**
   * Like Btn
   */
  const [likes, setLikes] = useState(mainArticle?.likes || 0)
  const {isLiked, updateLikeStatus} = useLikeStatus(mainArticle?.id ?? '')

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
        articleId: mainArticle?.id ?? ''
      }
    }
  })

  const [addLikeMutation] = ApiV1.useAddLikeMutation({
    variables: {
      input: {
        articleId: mainArticle?.id ?? ''
      }
    }
  })

  function getUrl(article: SliderArticle): string {
    if (typeof window !== 'undefined') {
      return `${window.location.host}${article.url}`
    }
    return ''
  }

  const textBlock = (mainArticle?.blocks as ApiV1.Block[])?.find(isRichTextBlock)

  const publishedAt = mainArticle?.publishedAt
  const publicationDate = publishedAt ? format(new Date(publishedAt), 'd. MMM yyyy') : ''
  const publicationDay = publishedAt ? format(new Date(publishedAt), 'eeee') : ''

  if (!sliderArticles.length || !mainArticle) {
    return <div>loading</div>
  }

  return (
    <Container>
      <HeaderContainer>
        <TitleContainer>
          Basler*in <br /> des Tages
        </TitleContainer>
        <SearchContainer>
          <SearchBar onSearchChange={handleSearch} />
          <UnderlineDate>{publicationDate}</UnderlineDate>
          <div>{publicationDay}</div>
        </SearchContainer>
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
                {mainIndex !== index && <SlideTitle>{article.title}</SlideTitle>}
              </>
            )}
          </SlideItem>
        ))}
      </SliderContainer>

      <TextContainer>
        <TextIntroduction>
          {mainArticle.lead ? (
            <h2>{mainArticle.lead} </h2>
          ) : (
            <h2>
              {mainArticle?.title}
              <span style={{fontSize: '1rem'}}>, weil ...</span>
            </h2>
          )}
        </TextIntroduction>
        {textBlock?.richText && <RichTextBlock richText={textBlock.richText} />}

        <BtnContainer>
          <LikeButton onClick={handleLike}>
            {isLiked ? '❤️' : '🤍'} <span>{likes}</span>
          </LikeButton>

          <CommentListItemShare url={getUrl(mainArticle)} title="Share" />
        </BtnContainer>
      </TextContainer>
    </Container>
  )
}
