import {
  BlockInput,
  TagType,
  useArticleLazyQuery,
  useArticleListLazyQuery,
  useCreateArticleMutation,
  useCreateTagMutation,
  useImageListLazyQuery,
  usePublishArticleMutation,
  useTagListLazyQuery,
  useUploadImageMutation
} from '@wepublish/editor/api'
import {DirectusDownloader, DirectusSyncStatus, ImageInfo} from './directus-downloader'

export interface RequestCollection {
  createArticle: ReturnType<typeof useCreateArticleMutation>[0]
  publishArticle: ReturnType<typeof usePublishArticleMutation>[0]
  uploadImage: ReturnType<typeof useUploadImageMutation>[0]
  getExistingArticles: ReturnType<typeof useArticleListLazyQuery>[0]
  getExistingImages: ReturnType<typeof useImageListLazyQuery>[0]
  getExistingArticle: ReturnType<typeof useArticleLazyQuery>[0]
  getTags: ReturnType<typeof useTagListLazyQuery>[0]
  createTag: ReturnType<typeof useCreateTagMutation>[0]
}

export class BaseImporter {
  protected blocks: BlockInput[] = []
  private downloader = new DirectusDownloader(this.username, this.password)

  constructor(
    protected username: string,
    protected password: string,
    protected requests: RequestCollection
  ) {}

  protected async getOrCreateTagId(tag: string): Promise<string | undefined> {
    const {data: existingData} = await this.requests.getTags({
      variables: {
        filter: {
          tag
        }
      },
      fetchPolicy: 'no-cache'
    })

    if (existingData?.tags?.totalCount === 1) {
      return existingData?.tags?.nodes.find(t => t.tag === tag)?.id
    }

    const {data: newData} = await this.requests.createTag({
      variables: {
        tag,
        type: TagType.Article
      }
    })

    return newData?.createTag?.id
  }

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

  protected async transferImage(
    title: string,
    filename: string,
    image: ImageInfo,
    statusCallback: (status: DirectusSyncStatus) => void
  ) {
    console.log(`    Checking if image exists on Wepublish...`)

    const existingImageId = await this.checkImageExists(title, filename)
    if (existingImageId) {
      console.log(`    Image exists, skipping (${existingImageId})`)
      statusCallback(DirectusSyncStatus.ImageUploaded)
      return existingImageId
    }

    console.log(`    Downloading Directus image`)
    const file = await this.downloader.downloadImage(image)

    console.log(`    Image download complete`)
    statusCallback(DirectusSyncStatus.ImageDownloaded)

    console.log(`    Uploading image to wepublish`)
    const result = await this.requests.uploadImage({
      variables: {
        input: {
          file,
          filename: filename,
          title: title,
          focalPoint: {
            x: 0.5,
            y: 0.5
          }
        }
      }
    })

    console.log(`    Image upload complete.`)
    statusCallback(DirectusSyncStatus.ImageUploaded)

    return result.data?.uploadImage?.id
  }
}
