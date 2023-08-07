import {faker} from '@faker-js/faker'
import {Exact, FullImageFragment} from '@wepublish/website/api'

export const image: Exact<FullImageFragment> = {
  __typename: 'Image',
  id: faker.string.uuid(),
  mimeType: faker.system.mimeType(),
  format: faker.system.fileExt(),
  createdAt: faker.date.past().toISOString(),
  modifiedAt: faker.date.past().toISOString(),
  filename: faker.system.commonFileName(),
  extension: `.${faker.system.fileExt()}`,
  width: 1000,
  height: 500,
  fileSize: 8667448,
  description: faker.lorem.sentence(),
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPoint: {
    x: 0.5,
    y: 0.5
  },
  title: faker.lorem.words(),
  url: faker.image.urlPicsumPhotos({
    height: 500,
    width: 1000
  }),
  bigURL: faker.image.urlPicsumPhotos({
    height: 400,
    width: 800
  }),
  largeURL: faker.image.urlPicsumPhotos({
    height: 300,
    width: 500
  }),
  mediumURL: faker.image.urlPicsumPhotos({
    height: 200,
    width: 300
  }),
  smallURL: faker.image.urlPicsumPhotos({
    height: 100,
    width: 200
  }),
  squareBigURL: faker.image.urlPicsumPhotos({
    height: 800,
    width: 800
  }),
  squareLargeURL: faker.image.urlPicsumPhotos({
    height: 500,
    width: 500
  }),
  squareMediumURL: faker.image.urlPicsumPhotos({
    height: 300,
    width: 300
  }),
  squareSmallURL: faker.image.urlPicsumPhotos({
    height: 200,
    width: 200
  })
}
