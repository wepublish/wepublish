import {
  BlockInput,
  useArticleLazyQuery,
  useArticleListLazyQuery,
  useCreateArticleMutation,
  useImageListLazyQuery,
  usePublishArticleMutation,
  useUploadImageMutation
} from '@wepublish/editor/api'

export interface RequestCollection {
  createArticle: ReturnType<typeof useCreateArticleMutation>[0]
  publishArticle: ReturnType<typeof usePublishArticleMutation>[0]
  uploadImage: ReturnType<typeof useUploadImageMutation>[0]
  getExistingArticles: ReturnType<typeof useArticleListLazyQuery>[0]
  getExistingImages: ReturnType<typeof useImageListLazyQuery>[0]
  getExistingArticle: ReturnType<typeof useArticleLazyQuery>[0]
}

export class BaseImporter {
  protected blocks: BlockInput[] = []
  constructor(protected requests: RequestCollection) {}

  protected async checkImageExists(title: string, filename: string): Promise<string | null> {
    const {data} = await this.requests.getExistingImages({
      variables: {
        filter: title
      }
    })

    if (data && (data.images.totalCount || 0) > 0) {
      for (const image of data.images.nodes) {
        if (image.filename === filename) {
          return image.id
        }
      }
    }
    return null
  }

  protected async checkArticleExists(title: string, slug: string): Promise<string | null> {
    const {data} = await this.requests.getExistingArticles({
      variables: {
        filter: {
          title: title
        }
      }
    })

    if (data && (data.articles.totalCount || 0) > 0) {
      for (const article of data.articles.nodes) {
        const {data: details} = await this.requests.getExistingArticle({
          variables: {id: article.id}
        })
        if (details?.article?.latest.slug === slug) {
          return details.article.id
        }
      }
    }
    return null
  }
}
