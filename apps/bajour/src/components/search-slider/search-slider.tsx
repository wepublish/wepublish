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
import {KeenSliderInstance, TrackDetails, useKeenSlider} from 'keen-slider/react'
import {descend, eqBy, sortWith, uniqWith} from 'ramda'
import {useCallback, useMemo, useState} from 'react'
import {useDebounceCallback} from 'usehooks-ts'

import {LikeButton} from './like-button'
import {SearchBar} from './search-bar'
import {useLikeStatus} from './use-like-status'

export const SEARCH_SLIDER_TAG = 'search-slider'

const TAKE = 50

const SLIDER_SPACING = 12

const SLIDER_RATIO = 1.2

const SLIDER_WIDTH = 160
const SLIDER_WIDTH_MD = 300

const SLIDER_HEIGHT = SLIDER_WIDTH * SLIDER_RATIO
const SLIDER_HEIGHT_MD = SLIDER_WIDTH_MD * SLIDER_RATIO

const Container = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  row-gap: ${({theme}) => theme.spacing(2)};
  column-gap: ${SLIDER_SPACING}px;

  ${({theme}) => theme.breakpoints.up('sm')} {
    row-gap: ${({theme}) => theme.spacing(4)};
    column-gap: ${SLIDER_SPACING * 2}px;
    grid-template-columns: 20% auto;
  }
`

const HeaderContainer = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  grid-column: -1/1;

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-column-start: 2;
    grid-column-end: 3;
    grid-template-columns: 1fr 1fr;
  }
`

const TitleContainer = styled('div')`
  grid-column-start: 1;
  grid-column-end: 2;
  font-weight: bold;
  padding-left: ${({theme}) => theme.spacing(2)};

  ${({theme}) => theme.breakpoints.up('lg')} {
    padding-left: 0;
  }
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
  padding-right: ${({theme}) => theme.spacing(4)};

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
  background-color: ${({theme}) => theme.palette.secondary.main};
`

const SliderContainer = styled('div')`
  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-column: 2/3;
  }
`

const TextContainer = styled('div')`
  grid-column: -1/1;
  max-width: 500px;
  padding-left: ${({theme}) => theme.spacing(2)};
  padding-right: ${({theme}) => theme.spacing(2)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-column: 2/3;
    margin-right: 0;
    padding: unset;
  }
`

const BtnContainer = styled('div')`
  display: flex;
  gap: ${({theme}) => theme.spacing(1)};
  padding-top: ${({theme}) => theme.spacing(2)};
  font-size: 2em;
`

const SlideItem = styled('div')<{mainImage?: boolean}>`
  cursor: pointer;
  min-height: unset !important;
  height: ${SLIDER_HEIGHT}px;
  min-width: ${SLIDER_WIDTH}px !important;
  border: 2px solid
    ${({theme, mainImage}) => (mainImage ? theme.palette.primary.main : 'transparent')};
  border-radius: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  ${({theme}) => theme.breakpoints.up('sm')} {
    border-width: 3px;
    height: ${SLIDER_HEIGHT_MD}px;
    min-width: ${SLIDER_WIDTH_MD}px !important;
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

const sortArticlesByPublishedAt = sortWith<ApiV1.FullArticleFragment>([
  descend(article => +new Date(article.publishedAt))
])

const uniqueById = uniqWith(eqBy<ApiV1.FullArticleFragment>(a => a.id))

export function SearchSlider({article}: SearchSliderProps) {
  const {
    elements: {Image, H5}
  } = useWebsiteBuilder()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slidesDetails, setSlidesDetails] = useState<TrackDetails['slides']>()
  const [searchQuery, setSearchQuery] = useState<string | null>()

  // getting the first tag from initial article which is not the technical search-slider tag.
  const tag = useMemo(() => article?.tags.find(tag => tag.tag !== SEARCH_SLIDER_TAG), [article])

  const {data, fetchMore, refetch} = ApiV1.useFullArticleListQuery({
    variables: {
      take: TAKE,
      cursor: article.id,
      order: ApiV1.SortOrder.Descending,
      sort: ApiV1.ArticleSort.PublishedAt,
      filter: {
        tags: tag ? [tag.id] : []
      }
    }
  })

  const sliderArticles = useMemo(() => data?.articles.nodes ?? [], [data])
  const mainArticle = sliderArticles[currentSlide]
  const {likes, isLiked, handleLike} = useLikeStatus(mainArticle?.id ?? '', mainArticle?.likes)

  const paginateArticles = useDebounceCallback(
    useCallback(
      async (slideIndex: number, slider: KeenSliderInstance) => {
        const goesBack = slideIndex === 0

        if (!sliderArticles[slideIndex]) {
          return
        }

        if (!goesBack && slideIndex + 10 < sliderArticles.length) {
          return
        }

        if (goesBack && searchQuery) {
          // prevents accidental loading of data while typing in the search bar
          return
        }

        const prevArticle = sliderArticles[slideIndex]

        return fetchMore({
          variables: {
            cursor: sliderArticles[slideIndex].id,
            order: goesBack ? ApiV1.SortOrder.Ascending : ApiV1.SortOrder.Descending,
            filter: {
              title: searchQuery,
              tags: tag ? [tag.id] : []
            }
          },
          updateQuery: (prev, {fetchMoreResult}) => {
            if (!fetchMoreResult) {
              return prev
            }

            const nodes = uniqueById(
              sortArticlesByPublishedAt([...prev.articles.nodes, ...fetchMoreResult.articles.nodes])
            )

            if (nodes.length === prev.articles.nodes.length) {
              return prev
            }

            if (goesBack) {
              const index = nodes.findIndex(article => article.id === prevArticle.id)
              // When going back, we also have to move the index back
              setTimeout(() => slider.moveToIdx(index), 10)
            }

            return {
              ...prev,
              articles: {
                ...prev.articles,
                nodes
              }
            }
          }
        })
      },
      [fetchMore, searchQuery, sliderArticles, tag]
    ),
    100
  )

  const searchArticles = useDebounceCallback(
    useCallback(
      async (query: string, slider: KeenSliderInstance) => {
        await fetchMore({
          variables: {
            cursor: null,
            order: ApiV1.SortOrder.Descending,
            filter: {
              title: query,
              tags: tag ? [tag.id] : []
            }
          },
          updateQuery: (prev, {fetchMoreResult}) => {
            if (!fetchMoreResult?.articles?.nodes?.length) {
              return prev
            }

            slider.moveToIdx(0)

            return {
              ...fetchMoreResult,
              articles: {
                ...fetchMoreResult.articles,
                nodes: [...fetchMoreResult.articles.nodes]
              }
            }
          }
        })
      },
      [fetchMore, tag]
    ),
    100
  )

  const [sliderRef, keenSliderRef] = useKeenSlider({
    initial: 0,
    loop: {
      min: 0,
      max: (data?.articles?.nodes.length ?? 1) - 1
    },
    range: {
      align: true,
      min: 0,
      max: (data?.articles?.nodes.length ?? 1) - 1
    },
    slides: {
      number: TAKE,
      perView: 'auto',
      spacing: SLIDER_SPACING
    },
    mode: 'snap',
    slideChanged: async slider => {
      const slideIndex = slider.track.details.slides?.[slider.track.details.rel].abs
      setCurrentSlide(slideIndex)
      await paginateArticles(slideIndex, slider)
    },
    detailsChanged: s => {
      setSlidesDetails(s.track.details.slides)
    }
  })

  // generate an upper and lower part of the title
  const title = useMemo(() => {
    const splitTag = tag?.tag?.split('-') ?? []
    const firstWordLength = Math.floor(splitTag.length / 2)
    const upperTitlePart = splitTag.slice(0, firstWordLength).join(' ')
    const lowerTitlePart = splitTag.slice(firstWordLength).join(' ')

    return {
      upperTitlePart,
      lowerTitlePart
    }
  }, [tag])

  const textBlock = (mainArticle?.blocks as ApiV1.Block[])?.find(isRichTextBlock)
  const publicationDate = mainArticle?.publishedAt
    ? format(new Date(mainArticle?.publishedAt), 'd. MMM yyyy')
    : ''
  const publicationDay = mainArticle?.publishedAt
    ? format(new Date(mainArticle?.publishedAt), 'eeee')
    : ''

  if (!sliderArticles.length || !mainArticle) {
    return null
  }

  return (
    <Container>
      <HeaderContainer>
        <TitleContainer>
          <TitleUpperPart>{title.upperTitlePart}</TitleUpperPart>
          <TitleLowerPart>{title.lowerTitlePart}</TitleLowerPart>
        </TitleContainer>

        <SearchContainer>
          <SearchBar
            onSearchChange={async query => {
              setSearchQuery(query)

              if (!query) {
                await refetch()
                return
              }

              await searchArticles(query, keenSliderRef.current!)
            }}
          />

          <DateContainer>
            <u>{publicationDate}</u>
          </DateContainer>

          <div>{publicationDay}</div>
        </SearchContainer>
        <HeaderUnderline />
      </HeaderContainer>

      <SliderContainer ref={sliderRef} className="keen-slider">
        {[...Array(TAKE).keys()].map(idx => {
          const article = slidesDetails && sliderArticles[slidesDetails[idx].abs]

          return (
            <SlideItem
              key={idx}
              className={`keen-slider__slide`}
              mainImage={mainArticle.id === article?.id}
              onClick={() => keenSliderRef.current?.moveToIdx(idx)}>
              {article?.image && (
                <>
                  <Image image={article.image} />

                  {slidesDetails?.[idx].abs !== currentSlide && (
                    <SlideTitle>{article.title}</SlideTitle>
                  )}
                </>
              )}
            </SlideItem>
          )
        })}
      </SliderContainer>

      <TextContainer>
        <div>
          {mainArticle.preTitle ? (
            <H5 gutterBottom>{mainArticle.preTitle} </H5>
          ) : (
            <H5 gutterBottom>
              {mainArticle?.title}

              <span style={{fontSize: '1rem'}}>, weil ...</span>
            </H5>
          )}
        </div>

        {textBlock?.richText && <RichTextBlock richText={textBlock.richText} />}

        <BtnContainer>
          <LikeButton onLike={handleLike} isLiked={isLiked} likes={likes} />

          <CommentListItemShare url={mainArticle.url} title="Share" />
        </BtnContainer>
      </TextContainer>
    </Container>
  )
}