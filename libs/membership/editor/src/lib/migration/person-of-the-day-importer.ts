import {
  BlockInput,
  ImageBlockInput,
  RichTextBlockInput,
  TitleBlockInput
} from '@wepublish/editor/api'
import {DirectusDownloader, DirectusSyncStatus, ImageInfo} from './directus-downloader'
import {SlateDeserializer} from './slate-deserializer'
import {ElementNodeType} from '@wepublish/richtext/api'
import {slugify} from '@wepublish/utils'
import {BaseImporter, RequestCollection} from './base-importer'

export interface PersonOfTheDay {
  id: Number
  status: string
  user_created: string
  date_created: string
  user_updated: string
  date_updated: string
  name: string
  description: string
  publicationDate: string
  title: string
  image: ImageInfo
  likes: Number
  categories: string
  video: string
  syncStatus: DirectusSyncStatus
}

export class PersonOfTheDayImporter extends BaseImporter {
  private downloader = new DirectusDownloader()
  private deserializer = new SlateDeserializer()

  private imageID?: string
  private slug: string
  private imageFilename: string

  constructor(protected requests: RequestCollection, private person: PersonOfTheDay) {
    super(requests)
    this.slug = slugify(`${this.person.name}-${this.person.id.toString()}`)
    this.imageFilename = `${this.person.name}-${this.person.id.toString()}`
  }

  async run() {
    console.log(`Running importer for ${this.person.name}`)
    if (this.person.image) {
      this.imageID = await this.transferImage()
    }

    const blocks: BlockInput[] = []

    blocks.push({title: this.titleBlock()})

    if (this.person.image) {
      blocks.push({image: this.imageBlock()})
    }

    if (this.person.description) {
      blocks.push({richText: this.richTextBlock()})
    }

    if (this.person.video) {
      blocks.push({richText: this.videoBlock()})
    }

    console.log(`    Checking if article exists on Wepublish...`)

    const existingArticleId = await this.checkArticleExists(this.person.name, this.slug)
    if (existingArticleId) {
      this.person.syncStatus = DirectusSyncStatus.ArticlePublished
      console.log(`    Article exists, skipping (${existingArticleId})`)
      return
    }

    const articleResult = await this.requests.createArticle({
      variables: {
        input: {
          slug: this.slug,
          title: this.person.name,
          lead: this.person.title || '',
          authorIDs: [],
          tags: [this.person.categories],
          properties: [],
          hideAuthor: false,
          shared: false,
          breaking: false,
          socialMediaAuthorIDs: [],
          blocks: blocks,
          imageID: this.person.image ? this.imageID : null
        }
      }
    })

    console.log(`    Article created`)
    this.person.syncStatus = DirectusSyncStatus.ArticleCreated

    const id = articleResult.data?.createArticle.id

    console.log(`    Publishing article...`)
    const date = `${this.person.publicationDate}T04:00:00Z`
    await this.requests.publishArticle({
      variables: {
        id: id!,
        publishAt: date,
        updatedAt: date,
        publishedAt: date
      }
    })

    console.log(`    Article published`)
    this.person.syncStatus = DirectusSyncStatus.ArticlePublished
  }

  private async transferImage() {
    console.log(`    Checking if image exists on Wepublish...`)

    const existingImageId = await this.checkImageExists(this.person.name, this.imageFilename)
    if (existingImageId) {
      console.log(`    Image exists, skipping (${existingImageId})`)
      this.person.syncStatus = DirectusSyncStatus.ImageUploaded
      return existingImageId
    }

    console.log(`    Downloading Directus image`)
    const file = await this.downloader.downloadImage(this.person.image)

    console.log(`    Image download complete`)
    this.person.syncStatus = DirectusSyncStatus.ImageDownloaded

    console.log(`    Uploading image to wepublish`)
    const result = await this.requests.uploadImage({
      variables: {
        input: {
          file,
          filename: this.imageFilename,
          title: this.person.name
        }
      }
    })

    console.log(`    Image upload complete.`)
    this.person.syncStatus = DirectusSyncStatus.ImageUploaded

    return result.data?.uploadImage?.id!
  }

  private titleBlock(): TitleBlockInput {
    return {
      title: this.person.name,
      lead: this.person.title
    }
  }

  private richTextBlock(): RichTextBlockInput {
    const text = this.person.description.replace(/\n/, '')
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

  private videoBlock(): RichTextBlockInput {
    const url = this.person.video

    const linkNode = {
      type: ElementNodeType.Link,
      url: url,
      children: [{text: url}]
    }
    return {
      richText: [
        {
          type: 'paragraph',
          children: [linkNode]
        }
      ]
    }
  }
}
