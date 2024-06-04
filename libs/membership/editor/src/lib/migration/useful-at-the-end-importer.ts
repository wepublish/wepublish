import {
  BlockInput,
  ImageBlockInput,
  RichTextBlockInput,
  TitleBlockInput
} from '@wepublish/editor/api'
import {DirectusDownloader, DirectusSyncStatus, ImageInfo} from './directus-downloader'
import {SlateDeserializer} from './slate-deserializer'
import {slugify} from '@wepublish/utils'
import {BaseImporter, RequestCollection} from './base-importer'

export interface UsefulAtTheEnd {
  id: number
  date_created: string
  date_updated: string
  description: string
  geoLocalisation: any
  image: ImageInfo
  publicationDate: string
  sort: string
  status: string
  tags: string[]
  title: string
  url: string
  user_created: string
  user_updated: string
  syncStatus: DirectusSyncStatus
}

export class UsefulAtTheEndImporter extends BaseImporter {
  private downloader = new DirectusDownloader()
  private deserializer = new SlateDeserializer()

  private imageID?: string
  private slug: string
  private imageFilename: string

  constructor(protected requests: RequestCollection, private useful: UsefulAtTheEnd) {
    super(requests)
    this.slug = slugify(`${this.useful.title}-${this.useful.id.toString()}`)
    this.imageFilename = `${this.useful.title}-${this.useful.id.toString()}`
  }

  async run() {
    if (this.useful.id === 408) {
      return
    }
    console.log(`Running importer for ${this.useful.title}`)
    if (this.useful.image) {
      this.imageID = await this.transferImage()
    }

    const blocks: BlockInput[] = []

    blocks.push({title: this.titleBlock()})

    if (this.useful.image) {
      blocks.push({image: this.imageBlock()})
    }

    if (this.useful.description) {
      blocks.push({richText: this.richTextBlock()})
    }

    console.log(`    Checking if article exists on Wepublish...`)

    const existingArticleId = await this.checkArticleExists(this.useful.title, this.slug)
    if (existingArticleId) {
      this.useful.syncStatus = DirectusSyncStatus.ArticlePublished
      console.log(`    Article exists, skipping (${existingArticleId})`)
      return
    }

    const articleResult = await this.requests.createArticle({
      variables: {
        input: {
          slug: this.slug,
          title: this.useful.title,
          lead: '',
          authorIDs: [],
          tags: ['Das Nützliche zum Schluss'],
          properties: [],
          hideAuthor: false,
          shared: false,
          breaking: false,
          socialMediaAuthorIDs: [],
          blocks: blocks,
          imageID: this.useful.image ? this.imageID : null
        }
      }
    })

    console.log(`    Article created`)
    this.useful.syncStatus = DirectusSyncStatus.ArticleCreated

    const id = articleResult.data?.createArticle.id

    console.log(`    Publishing article...`)
    const date = `${this.useful.publicationDate}Z`
    await this.requests.publishArticle({
      variables: {
        id: id!,
        publishAt: date,
        updatedAt: date,
        publishedAt: date
      }
    })

    console.log(`    Article published`)
    this.useful.syncStatus = DirectusSyncStatus.ArticlePublished
  }

  private async transferImage() {
    console.log(`    Checking if image exists on Wepublish...`)

    const existingImageId = await this.checkImageExists(this.useful.title, this.imageFilename)
    if (existingImageId) {
      console.log(`    Image exists, skipping (${existingImageId})`)
      this.useful.syncStatus = DirectusSyncStatus.ImageUploaded
      return existingImageId
    }

    console.log(`    Downloading Directus image`)
    const file = await this.downloader.downloadImage(this.useful.image)

    console.log(`    Image download complete`)
    this.useful.syncStatus = DirectusSyncStatus.ImageDownloaded

    console.log(`    Uploading image to wepublish`)
    const result = await this.requests.uploadImage({
      variables: {
        input: {
          file,
          filename: this.imageFilename,
          title: this.useful.title
        }
      }
    })

    console.log(`    Image upload complete.`)
    this.useful.syncStatus = DirectusSyncStatus.ImageUploaded

    return result.data?.uploadImage?.id!
  }

  private titleBlock(): TitleBlockInput {
    return {
      title: this.useful.title,
      lead: ''
    }
  }

  private richTextBlock(): RichTextBlockInput {
    const text = this.useful.description.replace(/\n/, '')
    const richText = this.deserializer.run(text)
    return {
      richText: richText
    }
  }

  private imageBlock(): ImageBlockInput {
    return {
      imageID: this.imageID
    }
  }
}
