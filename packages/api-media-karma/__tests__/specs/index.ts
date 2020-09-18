import {KarmaMediaAdapter} from '../../src'
import {URL} from 'url'

let karmaMediaAdapter: KarmaMediaAdapter

beforeEach(() => {
  karmaMediaAdapter = new KarmaMediaAdapter(new URL('http://fake.localhost.com'), 'fakeToken1234')
})

test('Karma Media Adapter exists', () => {
  expect(karmaMediaAdapter).toBeDefined()
})

test('UploadImage should throw an error if no paramter is passed', async () => {
  await expect(karmaMediaAdapter.uploadImage()).rejects.toThrow()
})
