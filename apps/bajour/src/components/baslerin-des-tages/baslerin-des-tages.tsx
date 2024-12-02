import {ApiV1, isRichTextBlock, RichTextBlock, useWebsiteBuilder} from '@wepublish/website'
import {format} from 'date-fns'
import {useState} from 'react'
import {useLikeStatus} from './use-like-status'
import styled from '@emotion/styled'
import {Article} from '@wepublish/website/api'
import {MdShare, MdSearch} from 'react-icons/md'
import {SearchBar} from './search-bar'

const Container = styled('div')`
  display: grid;
  grid-template-rows: auto 180px auto;
  grid-template-columns: 10% 25% 1fr 15%;
  gap: 2em;
  grid-template-areas:
    '.... main title  ....  '
    'prev main slider slider'
    '.... main text   ....  ';
`

const PageTitle = styled('h1')`
  font-size: 2.3em;
  margin: 0;
`

const PageDateWrapper = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const SlideWrapper = styled('div')`
  display: flex;
  gap: 1em;
  border-top: 15px solid #feddd2;
  padding-top: 15px;
`

const SlideItem = styled.div`
  position: relative;
  cursor: pointer;
  img {
    width: 100%;
    height: 100%;
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

const DateWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  text-align: right;
  font-weight: 500;
  span:first-child {
    border-bottom: 1px solid black;
  }
`

const LikeButton = styled('div')`
  font-size: 2em;
  display: flex;
  align-items: center;
  gap: 0.2em;
  cursor: pointer;
  span {
    font-size: 0.7em;
  }
`

const CopyButton = styled('div')`
  font-size: 1.6em;
  cursor: pointer;
`

interface SliderArticle extends Omit<ApiV1.Article, 'comments' | 'socialMediaAuthors'> {}

interface BaslerinDesTagesProps {
  article: SliderArticle
  className?: string
}

export function BaslerinDesTages({article, className}: BaslerinDesTagesProps) {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  const [currentArticle, setCurrentArticle] = useState<SliderArticle>(article)
  const [sliderArticles, setSliderArticles] = useState<SliderArticle[]>([])
  const [skipCount, setSkipCount] = useState(0)

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
      take: 6,
      skip: skipCount,
      order: ApiV1.SortOrder.Descending,
      filter: {
        tags: [tagData?.tags?.nodes.at(0)?.id ?? ''],
        publicationDateFrom: {
          comparison: ApiV1.DateFilterComparison.Lower,
          date: currentArticle?.publishedAt
        }
      }
    },
    onCompleted: data => {
      const articles = data.articles.nodes as SliderArticle[]
      setSliderArticles(articles)
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

  const [phraseWithTagQuery] = ApiV1.usePhraseWithTagLazyQuery()
  const [getMoreArticles] = ApiV1.useFullArticleListLazyQuery()

  const handleSearch = async (query: string | undefined) => {
    setSearchQuery(query)
    if (!query) {
      return
    }
    const {data} = await phraseWithTagQuery({
      variables: {take: 7, tag: 'baslerin-des-tages', query}
    })
    const articles = data?.phraseWithTag?.articles?.nodes as SliderArticle[]
    if (articles.length > 0) {
      setCurrentArticle(articles[0])
      setSliderArticles(articles.slice(1))
    }
  }

  const handleCopy = () => {
    const url = currentArticle?.url
    navigator.clipboard.writeText(url).then(
      () => {
        alert('Link in Zwischenablage!')
      },
      err => {
        console.error('Failed to copy: ', err)
      }
    )
  }

  const loadMoreArticles = async (newCurrentArticle: SliderArticle, clickedPosition: number) => {
    setSkipCount(prev => prev + clickedPosition + 1)
    if (searchQuery) {
      // Load more search results
      const {data} = await phraseWithTagQuery({
        variables: {
          take: 6,
          tag: 'baslerin-des-tages',
          query: searchQuery,
          skip: skipCount
        }
      })
      const articles = data?.phraseWithTag?.articles?.nodes as SliderArticle[]
      setSliderArticles(articles)
    } else {
      // Load more articles from regular list
      const {data} = await getMoreArticles({
        variables: {
          take: 6,
          skip: 0,
          order: ApiV1.SortOrder.Descending,
          filter: {
            tags: [tagData?.tags?.nodes.at(0)?.id ?? ''],
            publicationDateFrom: {
              comparison: ApiV1.DateFilterComparison.Lower,
              date: newCurrentArticle.publishedAt
            }
          }
        }
      })
      const articles = (data?.articles?.nodes as SliderArticle[]) ?? []
      setSliderArticles(articles)
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
      <Container>
        <PageDateWrapper style={{gridArea: 'title'}}>
          <PageTitle>
            BASLER*IN
            <br />
            des Tages
          </PageTitle>
          <DateWrapper>
            <SearchBar onSearchChange={handleSearch} />
            <span>{publicationDate}</span>
            <span>{publicationDay}</span>
          </DateWrapper>
        </PageDateWrapper>

        <Image
          image={currentArticle.image}
          style={{
            gridArea: 'main',
            height: '400px',
            objectFit: 'cover',
            borderRadius: '15px',
            marginTop: '2em'
          }}
        />

        <SlideWrapper style={{gridArea: 'slider'}}>
          {sliderArticles.map(article => (
            <SlideItem
              key={article.id}
              onClick={async () => {
                setCurrentArticle(article as Article)
                const clickedPosition = sliderArticles.findIndex(a => a.id === article.id)
                await loadMoreArticles(article, clickedPosition)
              }}>
              {article.image && (
                <>
                  <Image image={article.image} style={{borderRadius: '15px', width: '120px'}} />
                  <SlideTitle>{article.title}</SlideTitle>
                </>
              )}
            </SlideItem>
          ))}
        </SlideWrapper>

        <section style={{gridArea: 'text'}}>
          <div style={{marginBottom: '1em'}}>
            {currentArticle.lead ? (
              <h2>{currentArticle.lead} </h2>
            ) : (
              <>
                <span>BASLER*IN des Tages ist </span>
                <h2>
                  {currentArticle.title}
                  <span style={{fontSize: '1rem'}}>, weil ...</span>
                </h2>
              </>
            )}
          </div>
          <div style={{maxWidth: '500px'}}>
            <RichTextBlock richText={textBlock.richText} />
          </div>
          <div style={{display: 'flex', marginTop: '2em', alignItems: 'flex-end', gap: '1em'}}>
            <LikeButton onClick={handleLike}>
              {isLiked ? '❤️' : '🤍'} <span>{likes}</span>
            </LikeButton>
            <CopyButton onClick={handleCopy}>
              <MdShare />
            </CopyButton>
          </div>
        </section>
      </Container>
    </div>
  )
}
