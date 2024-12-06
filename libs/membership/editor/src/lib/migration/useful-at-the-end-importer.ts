import {
  BlockInput,
  ImageBlockInput,
  RichTextBlockInput,
  TitleBlockInput
} from '@wepublish/editor/api'
import {DirectusSyncStatus, ImageInfo} from './directus-downloader'
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
  private deserializer = new SlateDeserializer()

  private imageID?: string
  private slug: string
  private imageFilename: string

  constructor(
    username: string,
    password: string,
    protected requests: RequestCollection,
    private useful: UsefulAtTheEnd
  ) {
    super(username, password, requests)
    this.slug = slugify(`${this.useful.title}-${this.useful.id.toString()}`)
    this.imageFilename = `${this.useful.title}-${this.useful.id.toString()}`
  }

  async run() {
    if (this.useful.id === 408) {
      return
    }
    console.log(`Running importer for ${this.useful.title}`)

    const tagId = await this.getTagId('useful-at-the-end')
    if (!tagId) {
      console.error(`    Tag not found`)
      return
    }

    if (this.useful.image) {
      this.imageID = await this.transferImage(
        this.useful.title,
        this.imageFilename,
        this.useful.image,
        status => (this.useful.syncStatus = status)
      )
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
          tags: [tagId],
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
