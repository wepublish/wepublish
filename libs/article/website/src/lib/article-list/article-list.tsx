import styled from '@emotion/styled'
import {Article, ArticleTeaser, Teaser, TeaserType} from '@wepublish/website/api'
import {BuilderArticleListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useMemo} from 'react'

export const ArticleListWrapper = styled('article')``

export const articleToTeaser = (article: Article): ArticleTeaser => ({
  __typename: 'ArticleTeaser',
  type: TeaserType.Article,
  article,
  image: null,
  lead: null,
  preTitle: null,
  title: null,
  articleID: null,
  imageID: null
})

export const ArticleList = ({data, className}: BuilderArticleListProps) => {
  const {
    blocks: {TeaserGrid}
  } = useWebsiteBuilder()

  const teasers = useMemo(
    () =>
      enrichTeaserListWithAds(
        data?.articles?.nodes.map(article => articleToTeaser(article as Article)) ?? []
      ),
    [data?.articles?.nodes]
  )

  return (
    <ArticleListWrapper className={className}>
      <TeaserGrid numColumns={3} teasers={teasers} />
    </ArticleListWrapper>
  )
}

function enrichTeaserListWithAds(teasers: Teaser[]) {
  return teasers.reduce((teasers: Teaser[], teaser: Teaser, index) => {
    if ((index + 3) % 6 === 0) {
      teasers.push({
        __typename: 'CustomTeaser',
        type: TeaserType.Custom,
        title: 'ad-small'
      })
    }
    teasers.push(teaser)
    return teasers
  }, [])
}
