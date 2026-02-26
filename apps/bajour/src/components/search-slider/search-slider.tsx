import 'keen-slider/keen-slider.min.css';

import styled from '@emotion/styled';
import { ArticleSEO } from '@wepublish/article/website';
import {
  isIFrameBlock,
  isRichTextBlock,
  RichTextBlock,
} from '@wepublish/block-content/website';
import { CommentListItemShare } from '@wepublish/comments/website';
import { H1, H4 } from '@wepublish/ui';
import {
  Article,
  ArticleSort,
  BlockContent,
  FullArticleFragment,
  SortOrder,
  useFullArticleListQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { format } from 'date-fns';
import {
  KeenSliderInstance,
  TrackDetails,
  useKeenSlider,
} from 'keen-slider/react';
import { useRouter } from 'next/router';
import { descend, eqBy, sortWith, uniqWith } from 'ramda';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { useDebounceCallback } from 'usehooks-ts';

import { LikeButton, VideoLikeButton } from './like-button';
import { SearchBar } from './search-bar';
import { useLikeStatus } from './use-like-status';

export const SEARCH_SLIDER_TAG = 'search-slider';

const TAKE = 50;

const SLIDER_SPACING = 12;

const SLIDER_RATIO = 1.2;

const SLIDER_WIDTH = 160;
const SLIDER_WIDTH_MD = 300;

const SLIDER_HEIGHT = SLIDER_WIDTH * SLIDER_RATIO;
const SLIDER_HEIGHT_MD = SLIDER_WIDTH_MD * SLIDER_RATIO;

const Container = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  row-gap: ${({ theme }) => theme.spacing(2)};
  column-gap: ${SLIDER_SPACING}px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    row-gap: ${({ theme }) => theme.spacing(4)};
    column-gap: ${SLIDER_SPACING * 2}px;
    grid-template-columns: 20% auto;
  }
`;

const HeaderContainer = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  grid-column: -1/1;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-column-start: 2;
    grid-column-end: 3;
    grid-template-columns: 1fr 1fr;
  }
`;

const TitleContainer = styled('div')`
  grid-column-start: 1;
  grid-column-end: 2;
  font-weight: bold;
  padding-left: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-left: 0;
  }
`;

const TitleUpperPart = styled(H1)`
  margin: 0;
  font-size: 2.2em;
  line-height: 1;
  font-weight: 400;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    font-size: 2.5em;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 3em;
  }
`;

const TitleLowerPart = styled(H4)`
  margin: 0;
  line-height: 1.6;
  font-weight: 400;
`;

const SearchContainer = styled('div')`
  grid-column-start: 2;
  grid-column-end: 3;
  padding-right: ${({ theme }) => theme.spacing(4)};
  text-align: end;
  font-size: ${({ theme }) => theme.typography.subtitle2.fontSize};

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding-right: 0;
    font-size: ${({ theme }) => theme.typography.subtitle1.fontSize};
  }
`;

const SearchHits = styled('div')`
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};
  font-size: ${({ theme }) => theme.typography.subtitle1.fontSize};
  font-weight: 700;
`;

const DateContainer = styled('div')`
  ${({ theme }) => theme.breakpoints.up('md')} {
    margin-top: 0;
  }
`;

const HeaderUnderline = styled('div')`
  height: ${({ theme }) => theme.spacing(2)};
  grid-column-start: 1;
  grid-column-end: 3;
  background-color: ${({ theme }) => theme.palette.secondary.main};
`;

const SliderContainer = styled('div')`
  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-column: 2/3;
  }
`;

const TextContainer = styled('div')`
  grid-column: -1/1;
  max-width: 500px;
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-column: 2/3;
    margin-right: 0;
    padding: unset;
  }
`;

const BtnContainer = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  padding-top: ${({ theme }) => theme.spacing(2)};
  font-size: 2em;
`;

const SlideItem = styled('div')<{ mainImage?: boolean }>`
  cursor: pointer;
  position: relative;
  min-height: unset !important;
  height: ${SLIDER_HEIGHT}px;
  min-width: ${SLIDER_WIDTH}px !important;
  border: 2px solid
    ${({ theme, mainImage }) =>
      mainImage ? theme.palette.primary.main : 'transparent'};
  border-radius: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    border-width: 3px;
    height: ${SLIDER_HEIGHT_MD}px;
    min-width: ${SLIDER_WIDTH_MD}px !important;
  }
`;

const SlideItemOverlay = styled('div')<{ mainImage?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.45);
`;

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
`;

const FullScreenVideoContainer = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: black;
  z-index: 13;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const FullScreenVideo = styled('video')`
  width: 90vw;
  height: 85vh;
`;

const VideoNavigationButton = styled('button')<{ position: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ position }) => (position === 'left' ? 'left: 20px;' : 'right: 20px;')}
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  font-size: 2rem;
  z-index: 14;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    width: 32px;
    height: 32px;
  }
`;

type SearchSliderProps = {
  article: Article;
  includeSEO?: boolean;
  className?: string;
};

const sortArticlesByPublishedAt = sortWith<FullArticleFragment>([
  descend(article =>
    article.publishedAt ? +new Date(article.publishedAt) : -1
  ),
]);

const uniqueById = uniqWith(eqBy<FullArticleFragment>(a => a.id));

export function SearchSlider({
  article,
  includeSEO,
  className,
}: SearchSliderProps) {
  const {
    elements: { Image, H5, Button },
  } = useWebsiteBuilder();

  const router = useRouter();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesDetails, setSlidesDetails] = useState<TrackDetails['slides']>();
  const [searchQuery, setSearchQuery] = useState<string | null>();
  const [searchHits, setSearchHits] = useState<number>();
  const [videoUrl, setVideoUrl] = useState<string>();

  // getting the first tag from initial article which is not the technical search-slider tag.
  const tag = useMemo(
    () => article?.tags.find(tag => tag.tag !== SEARCH_SLIDER_TAG),
    [article]
  );

  const { data, fetchMore, refetch } = useFullArticleListQuery({
    variables: {
      take: TAKE,
      cursorId: article.id,
      order: SortOrder.Descending,
      sort: ArticleSort.PublishedAt,
      filter: {
        tags: tag ? [tag.id] : [],
      },
    },
  });

  const sliderArticles = useMemo(() => data?.articles.nodes ?? [], [data]);
  const mainArticle = sliderArticles[currentSlide];
  const { likes, isLiked, isReady, handleLike } = useLikeStatus(
    mainArticle?.id ?? '',
    mainArticle?.likes
  );

  const paginateArticles = useDebounceCallback(
    useCallback(
      async (slideIndex: number, slider: KeenSliderInstance) => {
        const goesBack = slideIndex === 0;

        if (!sliderArticles[slideIndex]) {
          return;
        }

        if (!goesBack && slideIndex + 10 < sliderArticles.length) {
          return;
        }

        if (goesBack && searchQuery) {
          // prevents accidental loading of data while typing in the search bar
          return;
        }

        const prevArticle = sliderArticles[slideIndex];

        return fetchMore({
          variables: {
            cursor: sliderArticles[slideIndex].id,
            order: goesBack ? SortOrder.Ascending : SortOrder.Descending,
            filter: {
              body: searchQuery,
              tags: tag ? [tag.id] : [],
            },
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) {
              return prev;
            }

            const nodes = uniqueById(
              sortArticlesByPublishedAt([
                ...prev.articles.nodes,
                ...fetchMoreResult.articles.nodes,
              ])
            );

            if (nodes.length === prev.articles.nodes.length) {
              return prev;
            }

            if (goesBack) {
              const index = nodes.findIndex(
                article => article.id === prevArticle.id
              );
              // When going back, we also have to move the index back
              setTimeout(() => slider.moveToIdx(index), 10);
            }

            return {
              ...prev,
              articles: {
                ...prev.articles,
                nodes,
              },
            };
          },
        });
      },
      [fetchMore, searchQuery, sliderArticles, tag]
    ),
    100
  );

  const searchArticles = useDebounceCallback(
    useCallback(
      async (query: string, slider: KeenSliderInstance) => {
        await fetchMore({
          variables: {
            cursorId: null,
            order: SortOrder.Descending,
            filter: {
              body: query,
              tags: tag ? [tag.id] : [],
            },
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            const foundArticles = fetchMoreResult?.articles?.nodes?.length;
            setSearchHits(foundArticles);
            if (!foundArticles) {
              return prev;
            }

            slider.moveToIdx(0);

            return {
              ...fetchMoreResult,
              articles: {
                ...fetchMoreResult.articles,
                nodes: [...fetchMoreResult.articles.nodes],
              },
            };
          },
        });
      },
      [fetchMore, tag]
    ),
    100
  );

  const [sliderRef, keenSliderRef] = useKeenSlider({
    initial: 0,
    loop: {
      min: 0,
      max: (data?.articles?.nodes.length ?? 1) - 1,
    },
    range: {
      align: true,
      min: 0,
      max: (data?.articles?.nodes.length ?? 1) - 1,
    },
    slides: {
      number: TAKE,
      perView: 'auto',
      spacing: SLIDER_SPACING,
    },
    mode: 'snap',
    slideChanged: async slider => {
      const slideIndex =
        slider.track.details.slides?.[slider.track.details.rel].abs;
      setCurrentSlide(slideIndex);
      await paginateArticles(slideIndex, slider);
    },
    detailsChanged: s => {
      setSlidesDetails(s.track.details.slides);
    },
  });

  // like main article via query param userAction
  useEffect(() => {
    // main article must be ready
    if (!mainArticle) {
      return;
    }

    // router query must contain a slug
    if (!router.query?.slug) {
      return;
    }

    // only vote on the designated main article
    if (router.query.slug !== mainArticle.slug) {
      return;
    }

    // router must be ready
    if (!router.isReady) {
      return;
    }

    // add like, if userAction in query is set to like
    if (router.query?.userAction === 'like') {
      handleLike(true);
    }
  }, [router.isReady, router.query, mainArticle, handleLike]);

  // generate an upper and lower part of the title
  const title = useMemo(() => {
    const splitTag = tag?.tag?.split(' ') ?? [];
    const firstWordLength = Math.floor(splitTag.length / 2);
    const upperTitlePart = splitTag.slice(0, firstWordLength).join(' ');
    const lowerTitlePart = splitTag.slice(firstWordLength).join(' ');

    return {
      upperTitlePart,
      lowerTitlePart,
    };
  }, [tag]);

  const textBlock = (mainArticle?.latest.blocks as BlockContent[])?.find(
    isRichTextBlock
  );
  const videoBlock = (mainArticle?.latest.blocks as BlockContent[])?.find(
    isIFrameBlock
  );
  const publicationDate =
    mainArticle?.publishedAt ?
      format(new Date(mainArticle?.publishedAt), 'd. MMM yyyy')
    : '';
  const publicationDay =
    mainArticle?.publishedAt ?
      format(new Date(mainArticle?.publishedAt), 'eeee')
    : '';

  const articlesWithVideos = sliderArticles
    .map((article, index) => {
      const hasVideo = (article?.latest.blocks as BlockContent[])?.find(
        isIFrameBlock
      )?.url;
      return hasVideo ? { article, index, videoUrl: hasVideo } : null;
    })
    .filter(Boolean);

  const currentVideoIndex = articlesWithVideos.findIndex(
    item => item?.article.id === mainArticle?.id
  );

  const hasPreviousVideo = currentVideoIndex > 0;
  const hasNextVideo = currentVideoIndex < articlesWithVideos.length - 1;

  const navigateToVideo = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && hasPreviousVideo) {
      const prevVideo = articlesWithVideos[currentVideoIndex - 1];
      if (prevVideo) {
        keenSliderRef.current?.moveToIdx(prevVideo.index);
        setCurrentSlide(prevVideo.index);
        setVideoUrl(prevVideo.videoUrl);
      }
    } else if (direction === 'next' && hasNextVideo) {
      const nextVideo = articlesWithVideos[currentVideoIndex + 1];
      if (nextVideo) {
        keenSliderRef.current?.moveToIdx(nextVideo.index);
        setCurrentSlide(nextVideo.index);
        setVideoUrl(nextVideo.videoUrl);
      }
    }
  };

  if (!sliderArticles.length || !mainArticle) {
    return null;
  }

  return (
    <Container className={className}>
      {includeSEO && <ArticleSEO article={article as Article} />}

      <HeaderContainer>
        <TitleContainer>
          <TitleUpperPart>{title.upperTitlePart}</TitleUpperPart>
          <TitleLowerPart>{title.lowerTitlePart}</TitleLowerPart>
        </TitleContainer>

        <SearchContainer>
          <SearchBar
            onSearchChange={async query => {
              setSearchQuery(query);

              if (!query) {
                await refetch();
                return;
              }

              await searchArticles(query, keenSliderRef.current!);
            }}
          />

          <SearchHits>
            {!!searchQuery && (
              <strong>
                {searchHits} Resultat{searchHits !== 1 && <>e</>}
              </strong>
            )}
          </SearchHits>

          <DateContainer>
            <u>{publicationDate}</u>
          </DateContainer>

          <div>{publicationDay}</div>
        </SearchContainer>
        <HeaderUnderline />
      </HeaderContainer>

      <SliderContainer
        ref={sliderRef}
        className="keen-slider"
      >
        {[...Array(TAKE).keys()].map(idx => {
          const article =
            slidesDetails && sliderArticles[slidesDetails[idx].abs];

          return (
            <SlideItem
              key={idx}
              className={`keen-slider__slide`}
              mainImage={mainArticle.id === article?.id}
              onClick={() => {
                // Click on current slide
                if (currentSlide === idx) {
                  if (videoBlock?.url) {
                    setVideoUrl(videoBlock.url);
                  }
                }
                keenSliderRef.current?.moveToIdx(idx);
                // used for the stuck slider elements on the very right side, if slider can't be moved further to the right.
                setCurrentSlide(idx);
              }}
            >
              {article?.latest.image && (
                <>
                  <Image image={article.latest.image} />

                  {slidesDetails?.[idx].abs !== currentSlide && (
                    <SlideItemOverlay>
                      <SlideTitle>{article?.latest.title}</SlideTitle>
                    </SlideItemOverlay>
                  )}
                  {slidesDetails?.[idx].abs === currentSlide &&
                    article.latest.image.source && (
                      <SlideTitle>
                        Bild: {article.latest.image.source}
                      </SlideTitle>
                    )}
                </>
              )}
            </SlideItem>
          );
        })}
      </SliderContainer>

      {videoUrl && (
        <FullScreenVideoContainer>
          <VideoNavigationButton
            position="left"
            onClick={() => navigateToVideo('prev')}
            disabled={!hasPreviousVideo}
            aria-label="Previous video"
          >
            <MdChevronLeft />
          </VideoNavigationButton>

          <FullScreenVideo
            src={videoUrl}
            controls
            autoPlay
          />

          <VideoNavigationButton
            position="right"
            onClick={() => navigateToVideo('next')}
            disabled={!hasNextVideo}
            aria-label="Next video"
          >
            <MdChevronRight />
          </VideoNavigationButton>

          <BtnContainer>
            <VideoLikeButton
              onLike={() => handleLike()}
              isLiked={isLiked}
              likes={likes}
            />
            <Button onClick={() => setVideoUrl(undefined)}>Schliessen</Button>
          </BtnContainer>
        </FullScreenVideoContainer>
      )}

      <TextContainer>
        <div>
          {mainArticle.latest.preTitle && (
            <H5 gutterBottom>{mainArticle.latest.preTitle} </H5>
          )}
        </div>

        {textBlock?.richText && <RichTextBlock richText={textBlock.richText} />}

        <BtnContainer>
          <LikeButton
            onLike={() => handleLike()}
            isLiked={isLiked}
            likes={likes}
          />

          <CommentListItemShare
            url={mainArticle.url}
            title="Share"
          />
        </BtnContainer>
      </TextContainer>
    </Container>
  );
}
