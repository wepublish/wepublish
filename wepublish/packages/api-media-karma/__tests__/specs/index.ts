import {KarmaMediaAdapter, MediaServerError} from '../../src'
import {URL} from 'url'
import * as fs from 'fs'
import {
  ArrayBufferUpload,
  Image,
  ImageOutput,
  ImageRotation,
  ImageTransformation
} from '@wepublish/api'
import {FileUpload} from 'graphql-upload'
import fetch from 'node-fetch'
import FormData = require('form-data')

jest.mock('node-fetch')
const {Response} = jest.requireActual('node-fetch')
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>

const TEST_URL = 'http://fake.localhost.com/'
const TEST_TOKEN = 'fakeToken1234'
const TEST_IMAGE_PATH = './__tests__/specs/test.jpg'
const TEST_UPLOAD_IMAGE: Image = {
  createdAt: new Date(),
  modifiedAt: new Date(),
  tags: [],
  id: 'testId',
  filename: 'test.jpg',
  fileSize: 1024,
  extension: '.jpg',
  mimeType: 'image/jpeg',
  format: 'testFormat',
  width: 1024,
  height: 1024
}

const TEST_TRANSFORMATION: ImageTransformation = {
  height: '1024px',
  width: '1024px',
  rotation: ImageRotation.Rotate0,
  output: ImageOutput.JPEG,
  quality: 100
}

let karmaMediaAdapter: KarmaMediaAdapter

let image: ArrayBuffer
let arrayBufferPromise: Promise<ArrayBufferUpload>

let imageStream: fs.ReadStream
let fileUploadPromise: Promise<FileUpload>

beforeEach(() => {
  karmaMediaAdapter = new KarmaMediaAdapter(new URL(TEST_URL), TEST_TOKEN)
})

test('Karma Media Adapter exists', () => {
  expect(karmaMediaAdapter).toBeDefined()
})

describe('UploadImage', () => {
  beforeEach(() => {
    imageStream = fs.createReadStream(TEST_IMAGE_PATH)
    fileUploadPromise = new Promise<FileUpload>(resolve => {
      resolve({
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        encoding: 'fakeEncoding',
        createReadStream: () => imageStream
      })
    })
  })

  test('should throw an error if mediaServer responds with error', async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify({}), {status: 404}))

    await expect(karmaMediaAdapter.uploadImage(fileUploadPromise)).rejects.toThrowError(
      MediaServerError
    )
  })

  test('should accept UploadImage', async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify(TEST_UPLOAD_IMAGE)))
    const uploadedImage = await karmaMediaAdapter.uploadImage(fileUploadPromise)

    expect(fetch).toHaveBeenCalledWith(
      new URL(TEST_URL),
      expect.objectContaining({method: 'POST', body: expect.any(FormData)})
    )
    expect(uploadedImage.filename).toBe('test.jpg')
  })

  afterEach(() => {
    imageStream.close()
  })
})

describe('UploadImageFromArrayBuffer', () => {
  beforeEach(() => {
    image = fs.readFileSync(TEST_IMAGE_PATH)
    arrayBufferPromise = new Promise<ArrayBufferUpload>(resolve => {
      resolve({
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
        arrayBuffer: image
      })
    })
  })

  test('should throw an error if mediaServer responds with error', async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify({}), {status: 404}))

    await expect(
      karmaMediaAdapter.uploadImageFromArrayBuffer(arrayBufferPromise)
    ).rejects.toThrowError(MediaServerError)
  })

  test('should accept ArrayBuffer', async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify(TEST_UPLOAD_IMAGE)))
    const uploadedImage = await karmaMediaAdapter.uploadImageFromArrayBuffer(arrayBufferPromise)

    expect(fetch).toHaveBeenCalledWith(
      new URL(TEST_URL),
      expect.objectContaining({method: 'POST', body: expect.any(FormData)})
    )
    expect(uploadedImage.filename).toBe('test.jpg')
  })
})

describe('KarmaMediaAdapter', () => {
  test('DeleteImage should return boolean', async () => {
    mockedFetch.mockResolvedValue(new Response(null, {status: 204}))
    const result = await karmaMediaAdapter.deleteImage('fakeId')

    expect(fetch).toHaveBeenCalledWith(
      `${new URL(TEST_URL)}${'fakeId'}`,
      expect.objectContaining({method: 'DELETE'})
    )
    expect(result).toBeTruthy()
  })

  test('DeleteImage should throw error if mediaServer responds with error', async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify({}), {status: 404}))

    await expect(karmaMediaAdapter.deleteImage('fakeId')).rejects.toThrowError(MediaServerError)
  })

  test('GetImageURL should return a string without transformation', async () => {
    const imageURL = await karmaMediaAdapter.getImageURL(TEST_UPLOAD_IMAGE)

    expect(imageURL).toContain(TEST_UPLOAD_IMAGE.id)
    expect(imageURL).toContain(TEST_UPLOAD_IMAGE.filename)
  })

  test('GetImageURL should return a string with empty transformation', async () => {
    const imageURL = await karmaMediaAdapter.getImageURL(TEST_UPLOAD_IMAGE, {})

    expect(imageURL).toContain(TEST_UPLOAD_IMAGE.id)
    expect(imageURL).toContain(TEST_UPLOAD_IMAGE.filename)
    expect(imageURL).not.toContain('/t/')
  })

  test('GetImageURL should return a string with transformation', async () => {
    const testImageWithFocal: Image = {
      ...TEST_UPLOAD_IMAGE,
      focalPoint: {
        x: 50,
        y: 50
      }
    }
    const imageURL = await karmaMediaAdapter.getImageURL(testImageWithFocal, TEST_TRANSFORMATION)

    expect(imageURL).toContain(TEST_UPLOAD_IMAGE.id)
    expect(imageURL).toContain(TEST_UPLOAD_IMAGE.filename)
    expect(imageURL).toContain('/t/')
    expect(imageURL).toContain(`w_${TEST_TRANSFORMATION.width}`)
    expect(imageURL).toContain(`h_${TEST_TRANSFORMATION.height}`)
    expect(imageURL).toContain(`q_${TEST_TRANSFORMATION.quality}`)
    expect(imageURL).toContain(`f_50.000:50.000`)
  })
})
