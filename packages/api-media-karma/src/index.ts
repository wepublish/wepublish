import {MediaAdapter, Image, UploadImage, ImageTransformation} from '@wepublish/api'
import {FileUpload} from 'graphql-upload'
import fetch from 'node-fetch'
import FormData from 'form-data'
import {ApolloError} from 'apollo-server'
import {URL} from 'url'

export class KarmaMediaAdapter implements MediaAdapter {
  readonly url: URL
  readonly token: string

  constructor(url: URL, token: string) {
    this.url = url
    this.token = token
  }

  async uploadImage(file: Promise<FileUpload>): Promise<UploadImage> {
    const {filename, mimetype, createReadStream}: FileUpload = await file
    const form = new FormData()

    form.append('file', createReadStream(), {filename, contentType: mimetype})

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
      throw new ApolloError(`Received error from media server: ${JSON.stringify(json)}`)
    }

    return {...json, url: `${this.url}${json.id}/${json.filename}${json.extension}`}
  }

  async getImageURL(
    {id, filename, extension, focusPoint}: Image,
    transformation?: ImageTransformation
  ): Promise<string> {
    if (transformation) {
      const {width, height, rotation, output, quality} = transformation
      const fullFilename = encodeURIComponent(`${filename}${output ? `.${output}` : extension}`)
      const transformations = []

      if (width) transformations.push(`w_${width}`)
      if (height) transformations.push(`h_${height}`)
      if (rotation) transformations.push(`r_${rotation}`)
      if (output) transformations.push(`o_${output}`)
      if (quality) transformations.push(`q_${quality}`)
      if (focusPoint && (width || height)) transformations.push(`f_${focusPoint.x}:${focusPoint.y}`)

      if (transformations.length > 0) {
        return `${this.url}${id}/${transformations.join(',')}/${fullFilename}`
      } else {
        return `${this.url}${id}/${fullFilename}`
      }
    } else {
      const fullFilename = encodeURIComponent(`${filename}${extension}`)
      return `${this.url}${id}/${fullFilename}`
    }
  }
}
