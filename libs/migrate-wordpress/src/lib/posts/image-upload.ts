import axios from 'axios'
import FormData from 'form-data'
import {Readable} from 'stream'
import {privateGraphqlEndpoint, privateToken} from './private-api'
import {UploadImageInput} from '../../api/private'

async function getDownloadStream(fileUrl: string): Promise<Readable> {
  const response = await axios({
    url: fileUrl,
    method: 'GET',
    responseType: 'stream'
  })

  return response.data
}

function prepareFileInput(stream: Readable, input: UploadStreamInput) {
  const form = new FormData()
  form.append(
    'operations',
    JSON.stringify({
      query: `
      mutation UploadImage($input: UploadImageInput!) {
        uploadImage(input: $input) {
          id
        }
      }
    `,
      variables: {
        input: {
          focalPoint: {
            x: 0.5,
            y: 0.5
          },
          ...input
        }
      }
    })
  )
  form.append(
    'map',
    JSON.stringify({
      '0': ['variables.input.file']
    })
  )
  form.append('0', stream)

  return form
}

async function uploadStream(stream: Readable, input: UploadStreamInput) {
  const form = prepareFileInput(stream, input)
  const uploadResponse = await axios.post(privateGraphqlEndpoint, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${privateToken}`
    }
  })
  if (uploadResponse.data.errors) {
    throw new Error(JSON.stringify(uploadResponse.data.errors, undefined, '  '))
  }
  return uploadResponse.data.data
}

type UploadStreamInput = Omit<UploadImageInput, 'file' | 'filename'> & {filename: string}
type CreateImageInput = UploadStreamInput & {downloadUrl: string}

export async function createImage({downloadUrl, ...input}: CreateImageInput) {
  const downloadStream = await getDownloadStream(downloadUrl)
  return (await uploadStream(downloadStream, input)).uploadImage!
}
