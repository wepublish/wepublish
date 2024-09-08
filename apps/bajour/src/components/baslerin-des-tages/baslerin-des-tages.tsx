import {ApiV1, isRichTextBlock, RichTextBlock} from '@wepublish/website'
import {useWebsiteBuilder} from '@wepublish/website'
import {format} from 'date-fns'
import {useState} from 'react'
import {LikeButton} from './like-button'
import {useLikeStatus} from './use-like-status'
import {SearchBar} from './search-bar'
import {
  ArticleListDesktop,
  ArticleListMobile,
  BaslerinDesTagesWrapper,
  Content,
  DateDisplay,
  DateWeekdayContainer,
  DesktopGrid,
  Heading,
  HeadingLarge,
  Headings,
  HeadingsInner,
  ImageWrapperMobile,
  MobileGrid,
  Title,
  WeekdayDisplay
} from './styles'

interface BaslerinDesTagesProps {
  article: ApiV1.ArticleQuery
}

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

  const [currentArticle, setCurrentArticle] = useState(article.article)
  const [searchQuery, setSearchQuery] = useState<string | undefined>()

  const {data: tagData, loading: tagLoading} = ApiV1.useTagQuery({
    variables: {
      tag: 'baslerin-des-tages',
      type: ApiV1.TagType.Article
    }
  })

  const {
    data: articleData,
    loading: articleLoading,
    error: articleError,
    refetch: refetchArticles
  } = ApiV1.useArticleListQuery({
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

  /*const {data: phraseData, loading: phraseLoading, refetch: refetchPhrase} = ApiV1.usePhraseQuery({
    skip: !searchQuery,
    variables: {
      query: searchQuery
    }
  })*/

  /*const handleSearch = async (query: string) => {
    setSearchQuery(query)
    const { data } = await refetchPhrase({ query })
    if (data?.phrase?.articles?.nodes && Array.isArray(data.phrase.articles.nodes) && data.phrase.articles.nodes.length > 0) {
      setCurrentArticle(data.phrase.articles.nodes[0]);
    }
    await refetchArticles()
  }*/

  const handleSearch = async (query: string) => {
    console.log(query)
  }

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
    <BaslerinDesTagesWrapper>
      <DesktopGrid>
        <Image
          style={{gridRow: '1/4'}}
          image={currentArticle.image}
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
              <SearchBar onSearch={handleSearch} />
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
            preTitle={currentArticle?.preTitle}
            title={currentArticle.title}
            textBlock={textBlock}
          />

          <Content>
            <LikeButton isLiked={isLiked} likes={likes} onLike={handleLike} />
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
          <Image image={currentArticle.image} square css={{borderRadius: '15%', gridRow: '1/3'}} />
          <ArticleListMobile data={articleData} loading={articleLoading} error={articleError} />

          <DateWeekdayContainer>
            <DateDisplay>{publicationDate}</DateDisplay>
            <WeekdayDisplay>{publicationDay}</WeekdayDisplay>
          </DateWeekdayContainer>
        </ImageWrapperMobile>

        <ContentBlock
          preTitle={currentArticle?.preTitle}
          title={currentArticle.title}
          textBlock={textBlock}
        />

        <Content>
          <LikeButton isLiked={isLiked} likes={likes} onLike={handleLike} />
        </Content>
      </MobileGrid>
    </BaslerinDesTagesWrapper>
  )
}
