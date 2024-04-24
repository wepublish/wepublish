import moment, {Moment} from 'moment'
import {MetaInfo} from 'vue-meta'
import {decode} from 'html-entities'
import {stripHtml} from '~/sdk/wep/utils'

export type PersonOfTheDayType = {
  id: number
  name: string
  title?: string
  description?: string
  publicationDate?: Moment
  image: string
  video?: string
  likes: number
  dummy?: boolean
}

export default class PersonOfTheDay {
  public id: number
  public name: string
  public title?: string
  public description?: string
  public publicationDate?: Moment
  public image: string
  public video?: string
  public likes: number
  public dummy?: boolean

  constructor({
    id,
    name,
    title,
    description,
    publicationDate,
    image,
    video,
    likes,
    dummy
  }: PersonOfTheDayType) {
    this.id = id
    this.name = name
    this.title = title
    this.description = description
    this.publicationDate = publicationDate ? moment(publicationDate).locale('de_CH') : undefined
    this.image = image
    this.video = video
    this.likes = likes
    this.dummy = dummy
  }

  public getImgUrl({directusUrl}: {directusUrl: string}) {
    return `${directusUrl}/assets/${this.image}`
  }

  public getSeoHead({
    baseUrl,
    directusUrl,
    twitterSite,
    title
  }: {
    baseUrl: string
    directusUrl: string
    twitterSite: string
    title: string
  }): MetaInfo {
    let description = ''
    // decode special html tags (like &auml;) and strip html tags (like <a></a>)
    if (this.description) {
      description = decode(this.description)
      description = stripHtml(description)
    }
    title = this.title ? this.title : title.replace('{name}', this.name)
    const url = `${baseUrl}/${this.id}`
    const imgUrl = this.getImgUrl({directusUrl})

    return {
      title,
      meta: [
        // open graph
        {hid: 'og:title', property: 'og:title', content: title},
        {hid: 'og:description', property: 'og:description', content: description},
        {hid: 'og:url', property: 'og:url', content: url},
        {hid: 'og:type', property: 'og:type', content: 'article'},
        {hid: 'og:image', property: 'og:image', content: imgUrl},
        {hid: 'og:locale', property: 'og:locale', content: 'de_CH'},

        // twitter
        {hid: 'twitter:card', name: 'twitter:card', content: 'summary'},
        {hid: 'twitter:site', name: 'twitter:site', content: twitterSite},
        {hid: 'twitter:title', name: 'twitter:title', content: title},
        {hid: 'twitter:description', name: 'twitter:description', content: description},
        {hid: 'twitter:image', property: 'twitter:image', content: imgUrl}
      ]
    }
  }

  public clone(): PersonOfTheDay {
    return new PersonOfTheDay(this)
  }
}
