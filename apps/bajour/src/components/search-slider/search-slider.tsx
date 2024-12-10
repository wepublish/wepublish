import 'keen-slider/keen-slider.min.css'

import {styled} from '@mui/material'
import {H1, H4} from '@wepublish/ui'
import {
  ApiV1,
  CommentListItemShare,
  isRichTextBlock,
  RichTextBlock,
  useWebsiteBuilder
} from '@wepublish/website'
import {format} from 'date-fns'
import {useKeenSlider} from 'keen-slider/react'
import {useRouter} from 'next/router'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {SearchBar} from './search-bar'
import {useLikeStatus} from './use-like-status'

export const SEARCH_SLIDER_TAG = 'search-slider'

const TAKE = 20

const SLIDER_SPACING = 12

const SLIDER_EXTRA_SPACING_MAIN = 0
const SLIDER_EXTRA_SPACING_MAIN_MD = 20

const SLIDER_RATIO = 1.2

const SLIDER_WIDTH = 80
const SLIDER_WIDTH_MD = 130

const SLIDER_MAIN_WIDTH = 150
const SLIDER_MAIN_WIDTH_MD = 320

const SLIDER_HEIGHT = SLIDER_WIDTH * SLIDER_RATIO
const SLIDER_HEIGHT_MD = SLIDER_WIDTH_MD * SLIDER_RATIO

const SLIDER_MAIN_HEIGHT = (SLIDER_MAIN_WIDTH - SLIDER_EXTRA_SPACING_MAIN) * SLIDER_RATIO
const SLIDER_MAIN_HEIGHT_MD = (SLIDER_MAIN_WIDTH_MD - SLIDER_EXTRA_SPACING_MAIN_MD) * SLIDER_RATIO

const SLIDER_DOWN_SHIFT = (SLIDER_MAIN_HEIGHT - SLIDER_HEIGHT) / 2
const SLIDER_DOWN_SHIFT_MD = (SLIDER_MAIN_HEIGHT_MD - SLIDER_HEIGHT_MD) / 3

const Container = styled('div')`
  display: grid;
  grid-template-columns:
    calc(${SLIDER_WIDTH}px + ${SLIDER_SPACING}px)
    auto;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns:
      calc(${SLIDER_MAIN_WIDTH_MD}px + ${SLIDER_WIDTH_MD}px + (2 * ${SLIDER_SPACING}px))
      auto;
  }
`

const HeaderContainer = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  grid-column-start: 2;
  grid-column-end: 3;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
    margin-bottom: -${SLIDER_DOWN_SHIFT_MD}px;
  }
`

const TitleContainer = styled('div')`
  grid-column-start: 1;
  grid-column-end: 2;
  font-weight: bold;
`

const TitleUpperPart = styled(H1)`
  margin: 0;
  font-size: 2.2em;
  line-height: 1;
  font-weight: 400;

  ${({theme}) => theme.breakpoints.up('sm')} {
    font-size: 2.5em;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 3em;
  }
`

const TitleLowerPart = styled(H4)`
  margin: 0;
  line-height: 1.6;
  font-weight: 400;
`

const SearchContainer = styled('div')`
  grid-column-start: 2;
  grid-column-end: 3;
  padding-right: ${({theme}) => theme.spacing(2)};

  text-align: end;
  font-size: ${({theme}) => theme.typography.subtitle2};

  ${({theme}) => theme.breakpoints.up('lg')} {
    padding-right: 0;
    font-size: ${({theme}) => theme.typography.subtitle1};
  }
`

const DateContainer = styled('div')`
  margin-top: -${({theme}) => theme.spacing(1)};

  ${({theme}) => theme.breakpoints.up('md')} {
    margin-top: 0;
  }
`

const HeaderUnderline = styled('div')`
  height: ${({theme}) => theme.spacing(2)};
  grid-column-start: 1;
  grid-column-end: 3;
  margin-bottom: ${({theme}) => theme.spacing(2)};
  margin-top: ${({theme}) => theme.spacing(2)};
  background-color: ${({theme}) => theme.palette.secondary.main};

  ${({theme}) => theme.breakpoints.up('md')} {
    margin-bottom: ${({theme}) => theme.spacing(3)};
    margin-top: ${({theme}) => theme.spacing(3)};
  }
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

  margin-right: ${({theme}) => theme.spacing(2)};

  ${({theme}) => theme.breakpoints.up('md')} {
    margin-top: -${SLIDER_DOWN_SHIFT_MD * 2}px;
    margin-right: 0;
  }
`

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
  height: ${props => (props.mainImage ? SLIDER_MAIN_HEIGHT : SLIDER_HEIGHT)}px;
  min-width: ${props => (props.mainImage ? SLIDER_MAIN_WIDTH : SLIDER_WIDTH)}px;

  margin-top: ${props => (props.mainImage ? 0 : SLIDER_DOWN_SHIFT)}px;

  padding-left: ${props => (props.mainImage ? SLIDER_EXTRA_SPACING_MAIN : 0)}px;
  padding-right: ${props => (props.mainImage ? SLIDER_EXTRA_SPACING_MAIN : 0)}px;

  img {
    width: 100%;
    height: 100%;
    border-radius: 15px;
    object-fit: cover;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    height: ${props => (props.mainImage ? SLIDER_MAIN_HEIGHT_MD : SLIDER_HEIGHT_MD)}px;
    min-width: ${props => (props.mainImage ? SLIDER_MAIN_WIDTH_MD : SLIDER_WIDTH_MD)}px;

    margin-top: ${props => (props.mainImage ? 0 : SLIDER_DOWN_SHIFT_MD)}px;

    padding-left: ${props => (props.mainImage ? SLIDER_EXTRA_SPACING_MAIN_MD : 0)}px;
    padding-right: ${props => (props.mainImage ? SLIDER_EXTRA_SPACING_MAIN_MD : 0)}px;
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

export type SliderArticle = Omit<ApiV1.Article, 'comments' | 'socialMediaAuthors'> & {
  blocks: ApiV1.Block[]
}

interface SearchSliderProps {
  article: SliderArticle
}

export function SearchSlider({article}: SearchSliderProps) {
  const {
    elements: {Image}
  } = useWebsiteBuilder()
  const {replace} = useRouter()

  const [mainIndex, setMainIndex] = useState<number>(1)
  const [sliderArticles, setSliderArticles] = useState<SliderArticle[]>([])
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined)
  const [skipCount, setSkipCount] = useState(0)

  const [phraseWithTagQuery] = ApiV1.usePhraseWithTagLazyQuery()
  const [getMoreArticles] = ApiV1.useFullArticleListLazyQuery()

  // getting the first tag from initial article which is not the technical search-slider tag.
  const tag = useMemo<string>(
    () => article?.tags.find(tag => tag.tag !== SEARCH_SLIDER_TAG)?.tag || '',
    [article]
  )

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
    }
  })

  const loadMoreArticles = useCallback(async () => {
    // only load more, if at least 10 articles before end
    if (mainIndex + 10 < sliderArticles.length) {
      return
    }

    const endOfQueueArticle = sliderArticles[sliderArticles.length - 1]

    if (searchQuery) {
      // Load more search results
      setSkipCount(prev => prev + TAKE)

      const {data} = await phraseWithTagQuery({
        variables: {
          take: TAKE,
          tag,
          query: searchQuery,
          skip: skipCount
        }
      })
      const articles = (data?.phraseWithTag?.articles?.nodes as SliderArticle[]) ?? []
      setSliderArticles([...sliderArticles, ...articles])
    } else {
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
  }, [mainIndex, sliderArticles, searchQuery, skipCount])

  // handle loading more articles in the background and updating the slider
  useEffect(() => {
    const animationEnded = async () => {
      keenSlider.current?.update()
      // goToArticle(mainArticle)
      await loadMoreArticles()
    }

    // initiate loading more articles in the background
    keenSlider.current?.on('animationEnded', animationEnded)

    // remove event listener
    return () => {
      keenSlider.current?.on('animationEnded', animationEnded, true)
    }
  }, [keenSlider, loadMoreArticles])

  // update slider after changes have been made to the articles array
  useEffect(() => {
    keenSlider.current?.update()
  }, [sliderArticles])

  const {data: tagData, loading: tagLoading} = ApiV1.useTagQuery({
    variables: {
      tag,
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
    setSearchQuery(query)
    if (!query) {
      return
    }
    keenSlider.current?.moveToIdx(0)
    const {data} = await phraseWithTagQuery({
      variables: {take: TAKE, tag, query}
    })
    const articles = data?.phraseWithTag?.articles?.nodes as SliderArticle[]
    if (articles.length > 0) {
      setSliderArticles(articles)
      setMainIndex(1)
    }
  }

  async function goToArticle(article: SliderArticle) {
    const newUrl = article?.url
    if (!newUrl) return
    await replace(newUrl)
  }

  function clickSlideItem(index: number) {
    if (mainIndex === index || index < 1) {
      return
    }
    setMainIndex(index - 1)
    keenSlider.current?.moveToIdx(index - 1)
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

  // generate an upper and lower part of the title
  const title = useMemo(() => {
    const splitTag = tag.split(' ')
    const firstWordLength = Math.floor(splitTag.length / 2)
    const upperTitlePart = splitTag.slice(0, firstWordLength).join(' ')
    const lowerTitlePart = splitTag.slice(firstWordLength).join(' ')

    return {
      upperTitlePart,
      lowerTitlePart
    }
  }, [tag])

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
          <TitleUpperPart>{title.upperTitlePart}</TitleUpperPart>
          <TitleLowerPart>{title.lowerTitlePart}</TitleLowerPart>
        </TitleContainer>
        <SearchContainer>
          <SearchBar onSearchChange={handleSearch} />
          <DateContainer>
            <u>{publicationDate}</u>
          </DateContainer>
          <div>{publicationDay}</div>
        </SearchContainer>
        <HeaderUnderline />
      </HeaderContainer>

      <SliderContainer ref={sliderRef} className="keen-slider">
        {sliderArticles.map((article, index) => (
          <SlideItem
            key={article.id}
            className={`keen-slider__slide number-slide${index}`}
            mainImage={mainIndex === index}
            onClick={() => clickSlideItem(index)}>
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
        <div>
          {mainArticle.lead ? (
            <h2>{mainArticle.lead} </h2>
          ) : (
            <h2>
              {mainArticle?.title}
              <span style={{fontSize: '1rem'}}>, weil ...</span>
            </h2>
          )}
        </div>
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
