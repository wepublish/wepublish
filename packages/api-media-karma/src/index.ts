import {MediaAdapter, Image, UploadImage, ImageTransformation, ArrayBufferUpload} from '../../api'
import {FileUpload} from 'graphql-upload'
import fetch from 'node-fetch'
import FormData from 'form-data'
import {URL} from 'url'

export class MediaServerError extends Error {
  constructor(message: string) {
    super(`Received error from media server. Message: ${message}`)
  }
}

export class KarmaMediaAdapter implements MediaAdapter {
  readonly url: URL
  readonly token: string

  constructor(url: URL, token: string) {
    this.url = url
    this.token = token
  }

  async _uploadImage(form: FormData): Promise<UploadImage> {
    // The form-data module reports a known length for the stream returned by createReadStream,
    // which is wrong, override it and always set it to false.
    // Related issue: https://github.com/form-data/form-data/issues/394
    form.hasKnownLength = () => false

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {authorization: `Bearer ${this.token}`},
      body: form
    })

    const json = await response.json()

    if (response.status !== 200) {
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
    const response = await fetch(`${this.url}${id}`, {
      method: 'DELETE',
      headers: {authorization: `Bearer ${this.token}`}
    })

    if (response.status !== 204) {
      throw new MediaServerError(response.statusText)
    }

    return true
  }

  async getImageURL(
    {id, filename, extension, focalPoint}: Image,
    transformation?: ImageTransformation
  ): Promise<string> {
    filename = filename || 'untitled'

    if (transformation) {
      const {width, height, rotation, output, quality} = transformation
      const fullFilename = encodeURIComponent(`${filename}${output ? `.${output}` : extension}`)
      const transformations = []

      if (width) transformations.push(`w_${width}`)
      if (height) transformations.push(`h_${height}`)
      if (rotation) transformations.push(`r_${rotation}`)
      if (output) transformations.push(`o_${output}`)
      if (quality) transformations.push(`q_${quality}`)

      if (focalPoint && (width || height)) {
        transformations.push(`f_${focalPoint.x.toFixed(3)}:${focalPoint.y.toFixed(3)}`)
      }

      if (transformations.length > 0) {
        return `${this.url}${id}/t/${transformations.join(',')}/${fullFilename}`
      } else {
        return `${this.url}${id}/${fullFilename}`
      }
    } else {
      const fullFilename = encodeURIComponent(`${filename}${extension}`)
      return `${this.url}${id}/${fullFilename}`
    }
  }
}
