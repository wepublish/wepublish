import {MediaAdapter, Image, ImageTransformation} from '@wepublish/api'
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

  async uploadImage(file: Promise<FileUpload>): Promise<Image> {
    const {filename, mimetype, createReadStream}: FileUpload = await file
    const form = new FormData()

    form.append('file', createReadStream(), {filename, contentType: mimetype})

    // The form-data module reports a known length for the stream returned by createReadStream,
    // which is wrong, override it and always set it to false.
    // Related issue: https://github.com/form-data/form-data/issues/394
    form.hasKnownLength = () => false

    const response = await fetch(this.url.toString(), {
      method: 'POST',
      headers: {authorization: `Bearer ${this.token}`},
      body: form
    })

    const json = await response.json()

    if (response.status !== 200) {
      throw new ApolloError(`Received error from media server: ${JSON.stringify(json)}`)
    }

    return {...json, url: `${this.url.toString()}${json.id}/${json.filename}${json.extension}`}
  }

  async getImageURLForTransformation(
    image: Image,
    _transformation: ImageTransformation
  ): Promise<string> {
    return image.url
  }
}
