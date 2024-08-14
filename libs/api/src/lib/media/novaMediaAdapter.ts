import {URL} from 'url'
import FormData from 'form-data'
import {ImageWithFocalPoint} from '../db/image'
import fetch from 'node-fetch'
import type {FileUpload} from 'graphql-upload'
import {
  ArrayBufferUpload,
  MediaAdapter,
  UploadImage,
  ImageTransformation,
  ImageRotation
} from '@wepublish/image/api'
import {MediaServerError} from './karmaMediaAdapter'

export class NovaMediaAdapter implements MediaAdapter {
  readonly url: URL
  readonly token: string
  readonly internalURL: URL

  constructor(url: URL, token: string, internalURL: URL = url) {
    this.url = url
    this.token = token
    this.internalURL = internalURL
  }

  async _uploadImage(form: FormData): Promise<UploadImage> {
    // The form-data module reports a known length for the stream returned by createReadStream,
    // which is wrong, override it and always set it to false.
    // Related issue: https://github.com/form-data/form-data/issues/394
    form.hasKnownLength = () => false

    const response = await fetch(this.internalURL, {
      method: 'POST',
      headers: {authorization: `Bearer ${this.token}`},
      body: form,
      signal: AbortSignal.timeout(50000)
    })

    const json = await response.json()

    if (response.status >= 400) {
      throw new MediaServerError(response.statusText)
    }

    const {id, filename, fileSize, extension, mimeType, format, width, height} = json

    return {
      id,
      filename,
      fileSize,
      extension,
      mimeType,
      format,
      width,
      height
    }
  }

  async uploadImage(fileUpload: Promise<FileUpload>): Promise<UploadImage> {
    const form = new FormData()

    const {filename: inputFilename, mimetype, createReadStream}: FileUpload = await fileUpload
    form.append('file', createReadStream(), {filename: inputFilename, contentType: mimetype})

    return this._uploadImage(form)
  }

  async uploadImageFromArrayBuffer(
    arrayBufferUpload: Promise<ArrayBufferUpload>
  ): Promise<UploadImage> {
    const form = new FormData()
    const {
      filename: inputFilename,
      mimetype,
      arrayBuffer
    }: ArrayBufferUpload = await arrayBufferUpload
    form.append('file', arrayBuffer, {filename: inputFilename, contentType: mimetype})

    return this._uploadImage(form)
  }

  async deleteImage(id: string): Promise<boolean> {
    const response = await fetch(`${this.internalURL}/${id}`, {
      method: 'DELETE',
      headers: {authorization: `Bearer ${this.token}`}
    })

    if (response.status >= 400) {
      throw new MediaServerError(response.statusText)
    }

    return true
  }

  async getImageURL(
    image: ImageWithFocalPoint,
    transformations?: ImageTransformation
  ): Promise<string> {
    const queryParameters = [] as string[]

    if (transformations?.width || transformations?.height) {
      let xFocalPoint = ''
      let yFocalPoint = ''
      if (image?.focalPoint?.x) {
        xFocalPoint = image.focalPoint.x > 0.6 ? 'right' : image.focalPoint.x < 0.4 ? 'left' : ''

        yFocalPoint = image.focalPoint.x > 0.6 ? 'bottom' : image.focalPoint.x < 0.4 ? 'top' : ''
      }

      const position = `${xFocalPoint} ${yFocalPoint}`.trim() || undefined

      queryParameters.push(
        `resize=${JSON.stringify({
          width: transformations.width,
          height: transformations.height,
          withoutEnlargement: true,
          fit: 'cover',
          position
        })}`
      )
    }

    if (
      transformations?.rotation &&
      // Ignore no rotation settings
      ![ImageRotation.Auto, ImageRotation.Rotate0].includes(transformations.rotation)
    ) {
      queryParameters.push(`rotate=${transformations.rotation}`)
    }

    if (transformations?.blur) {
      queryParameters.push(
        `blur=${Number.isInteger(transformations.blur) ? transformations.blur : 5}`
      )
    }

    if (transformations?.negate) {
      queryParameters.push(`negate=1`)
    }

    if (transformations?.grayscale) {
      queryParameters.push(`grayscale=1`)
    }

    if (transformations?.sharpen) {
      queryParameters.push(`sharpen=1`)
    }

    // Max quality is 80 so 1 => 80
    queryParameters.push(`quality=${transformations?.quality ? transformations.quality * 80 : 65}`)

    return `${this.url}/${image.id}?${queryParameters.join('&')}`
  }
}
