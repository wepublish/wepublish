import {
  ApiV1,
  isImageBlock,
  isTitleBlock,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserTitle
} from '@wepublish/website'

export const selectBajourTeaserTitle = (teaser: ApiV1.Teaser) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const titleBlock = teaser.page?.blocks?.find(isTitleBlock)
      return teaser.title || teaser.page?.title || titleBlock?.title
    }

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.blocks?.find(isTitleBlock)
      return teaser.title || teaser.article?.title || titleBlock?.title
    }
  }

  return selectTeaserTitle(teaser)
}

export const selectBajourTeaserLead = (teaser: ApiV1.Teaser) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const titleBlock = teaser.page?.blocks?.find(isTitleBlock)
      return teaser.lead || teaser.page?.description || titleBlock?.lead
    }

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      const titleBlock = teaser.article?.blocks?.find(isTitleBlock)
      return teaser.lead || teaser.article?.lead || titleBlock?.lead
    }
  }

  return selectTeaserLead(teaser)
}

export const selectBajourTeaserImage = (teaser: ApiV1.Teaser) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      const imageBlock = teaser.page?.blocks?.find(isImageBlock)
      return teaser.image ?? imageBlock?.image ?? teaser?.page?.image
    }

    case 'PeerArticleTeaser':
    case 'ArticleTeaser': {
      const imageBlock = teaser.article?.blocks?.find(isImageBlock)
      return teaser.image ?? imageBlock?.image ?? teaser?.article?.image
    }
  }

  return selectTeaserImage(teaser)
}
