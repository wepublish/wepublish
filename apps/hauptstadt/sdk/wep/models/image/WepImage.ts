import {gql} from 'graphql-tag'
import moment, {Moment} from 'moment'
import {Framework} from 'vuetify'
import FocalPoint from './FocalPoint'

export interface UploadImageInput {
  file: File
  filename?: string
  title?: string
  description?: string
  tags?: string[]
  link?: string
  source?: string
  license?: string
  focalPoint?: FocalPoint
}

export default class WepImage {
  public id: string
  public createdAt: Moment
  public modifiedAt: Moment
  public filename: string
  public title: string
  public description: string
  public tags: string[]
  public source: string
  public license: string
  public fileSize: number
  public extension: string
  public mimeType: string
  public format: string
  public width: number
  public height: number
  public focalPoint?: FocalPoint
  public url: string
  public xsUrl: string
  public smUrl: string
  public mdAndUpUrl: string

  constructor({
    id,
    createdAt,
    modifiedAt,
    filename,
    title,
    description,
    tags,
    source,
    license,
    fileSize,
    extension,
    mimeType,
    format,
    width,
    height,
    focalPoint,
    url,
    xsUrl,
    smUrl,
    mdAndUpUrl
  }: WepImage) {
    this.id = id
    this.createdAt = moment(createdAt)
    this.modifiedAt = moment(modifiedAt)
    this.filename = filename
    this.title = title
    this.description = description
    this.tags = tags
    this.source = source
    this.license = license
    this.fileSize = fileSize
    this.extension = extension
    this.mimeType = mimeType
    this.format = format
    this.width = width
    this.height = height
    this.focalPoint = focalPoint ? new FocalPoint(focalPoint) : undefined
    this.url = url
    this.xsUrl = xsUrl
    this.smUrl = smUrl
    this.mdAndUpUrl = mdAndUpUrl
  }

  /**
   * Get image url depending on the current breakpoint
   * @param $vuetify
   */
  public getUrl($vuetify: Framework): string {
    // in case of gif we have to provide the original file as it would not work otherwise
    if (this.format === 'gif') {
      return this.url
    }

    const breakpoint = $vuetify.breakpoint
    if (breakpoint.mdAndUp) {
      return this.mdAndUpUrl
    } else if (breakpoint.smAndUp) {
      return this.smUrl
    } else {
      return this.xsUrl
    }
  }

  /**
   *  GQL FRAGMENTS
   */
  public static focalPointFragment = gql`
    fragment focalPoint on Point {
      x
      y
    }
  `

  public static wepImageFragment = gql`
    fragment image on Image {
      id
      title
      description
      tags
      source
      license
      fileSize
      extension
      mimeType
      format
      width
      height
      focalPoint {
        ...focalPoint
      }
      url
      xsUrl: transformURL(input: {width: 1500})
      smUrl: transformURL(input: {width: 2000})
      mdAndUpUrl: transformURL(input: {width: 2500})
    }
    ${WepImage.focalPointFragment}
  `
}
