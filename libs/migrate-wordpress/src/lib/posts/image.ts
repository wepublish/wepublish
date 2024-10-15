import {URL} from 'url'
import {Readable} from 'stream'
import axios, {AxiosRequestConfig} from 'axios'
import FormData from 'form-data'
import {print} from 'graphql'
import {privateClient, privateGraphqlEndpoint, privateToken} from '../api/clients'
import {
  ImageList,
  ImageListQuery,
  ImageListQueryVariables,
  UpdateImage,
  UpdateImageMutation,
  UpdateImageMutationVariables,
  UploadImage,
  UploadImageInput,
  UploadImageMutationVariables
} from '../../api/private'

export type Image = {
  id: string
  title?: string | null
  description?: string | null
}

type EnsureImageProps = {
  url: string
  title: string
  description?: string
}

export const ensureImage = async (input: EnsureImageProps): Promise<Image | undefined> => {
  const {url, title} = input
  const description = input.description?.trim()

  const existingImage = await findImage(input)
  if (existingImage) {
    console.debug('  image exists', url)
    return await updateImage({
      id: existingImage.id,
      input: {
        focalPoint: existingImage.focalPoint,
        title,
        description
      }
    })
  }

  console.debug('  create image', url)
  try {
    const image = await createImage({
      downloadUrl: url,
      filename: new URL(url).pathname.split('/').pop() as string,
      title,
      link: url,
      description
    })
    return {
      id: image.id!,
      title,
      description
    }
  } catch (e) {
    return undefined
  }
}

export async function findImage({title, url}: Pick<EnsureImageProps, 'title' | 'url'>) {
  const filename = url.split('/').pop()!
  const foundImages = (await getImagesByTitle(filename)).nodes
  return foundImages.find(image => image.link === url)
}

// API

export async function getImagesByTitle(title: string) {
  return (
    await privateClient.request<ImageListQuery, ImageListQueryVariables>(ImageList, {
      filter: title,
      take: 100
    })
  ).images
}

export async function updateImage(variables: UpdateImageMutationVariables) {
  return (
    await privateClient.request<UpdateImageMutation, UpdateImageMutationVariables>(
      UpdateImage,
      variables
    )
  ).updateImage!
}

async function createImage({downloadUrl, ...input}: CreateImageInput) {
  const downloadStream = await getDownloadStream(downloadUrl)
  return (await uploadStream(downloadStream, input)).uploadImage!
}

async function getDownloadStream(fileUrl: string): Promise<Readable> {
  const requestConfig: AxiosRequestConfig = {
    url: fileUrl,
    method: 'GET',
    responseType: 'stream'
  }
  return (await axios(requestConfig)).data
}

function prepareFileInput(stream: Readable, input: UploadStreamInput) {
  const form = new FormData()
  form.append(
    'operations',
    JSON.stringify({
      query: print(UploadImage),
      variables: {
        input: {
          focalPoint: {
            x: 0.5,
            y: 0.5
          },
          ...input
        }
      } as UploadImageMutationVariables
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
