import {
  BlockInput,
  ImageBlockInput,
  RichTextBlockInput,
  TitleBlockInput
} from '@wepublish/editor/api'
import {DirectusSyncStatus, ImageInfo} from './directus-downloader'
import {SlateDeserializer} from './slate-deserializer'
import {ElementNodeType} from '@wepublish/richtext/api'
import {slugify} from '@wepublish/utils'
import {BaseImporter, RequestCollection} from './base-importer'

export interface PersonOfTheDay {
  id: number
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
  likes: number
  categories: string
  video: string
  syncStatus: DirectusSyncStatus
}

export class PersonOfTheDayImporter extends BaseImporter {
  private deserializer = new SlateDeserializer()

  private imageID?: string
  private slug: string
  private imageFilename: string

  constructor(
    username: string,
    password: string,
    protected requests: RequestCollection,
    private person: PersonOfTheDay
  ) {
    super(username, password, requests)
    this.slug = slugify(`${this.person.name}-${this.person.id.toString()}`)
    this.imageFilename = `${this.person.name}-${this.person.id.toString()}`
  }

  async run() {
    console.log(`Running importer for ${this.person.name}`)

    const tagId = await this.getOrCreateTagId(this.person.categories)
    if (!tagId) {
      console.log(
        `Tag ${this.person.categories} not found. CANCEL IMPORT FOR person with id ${this.person.id}`
      )
      return
    }

    const searchSliderTagId = await this.getOrCreateTagId('search-slider')
    if (!searchSliderTagId) {
      console.log(`Tag search-slider not found. CANCEL IMPORT FOR person with id ${this.person.id}`)
      return
    }

    if (this.person.image) {
      this.imageID = await this.transferImage(
        this.person.name,
        this.imageFilename,
        this.person.image,
        status => (this.person.syncStatus = status)
      )
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
          preTitle: this.person.title || '',
          authorIDs: [],
          tags: [tagId, searchSliderTagId],
          properties: [],
          hideAuthor: false,
          shared: false,
          breaking: false,
          socialMediaAuthorIDs: [],
          blocks,
          imageID: this.person.image ? this.imageID : null,
          likes: this.person.likes
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
      richText
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
      url,
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
