import {faker} from '@faker-js/faker'
import {Exact, Event, EventStatus} from '@wepublish/website/api'
import {image} from '../image/image'

export const event: Exact<Event> = {
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  description: [
    {
      type: 'paragraph',
      children: [
        {
          text: faker.lorem.sentence()
        },
        {
          text: faker.lorem.sentence(),
          bold: true
        },
        {
          text: faker.lorem.sentence(),
          italic: true
        },
        {
          text: faker.lorem.sentence(),
          underline: true
        },
        {
          text: faker.lorem.sentence(),
          strikethrough: true
        },
        {
          text: faker.lorem.sentence(12)
        },
        {
          text: faker.lorem.sentence(15)
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: faker.lorem.sentence()
        },
        {
          text: faker.lorem.sentence(),
          bold: true
        },
        {
          text: faker.lorem.sentence(),
          italic: true
        },
        {
          text: faker.lorem.sentence(),
          underline: true
        },
        {
          text: faker.lorem.sentence(),
          strikethrough: true
        },
        {
          text: faker.lorem.sentence(12)
        },
        {
          text: faker.lorem.sentence(15)
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: faker.lorem.sentence()
        },
        {
          text: faker.lorem.sentence(),
          bold: true
        },
        {
          text: faker.lorem.sentence(),
          italic: true
        },
        {
          text: faker.lorem.sentence(),
          underline: true
        },
        {
          text: faker.lorem.sentence(),
          strikethrough: true
        },
        {
          text: faker.lorem.sentence(12)
        },
        {
          text: faker.lorem.sentence(15)
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: faker.lorem.sentence()
        },
        {
          text: faker.lorem.sentence(),
          bold: true
        },
        {
          text: faker.lorem.sentence(),
          italic: true
        },
        {
          text: faker.lorem.sentence(),
          underline: true
        },
        {
          text: faker.lorem.sentence(),
          strikethrough: true
        },
        {
          text: faker.lorem.sentence()
        },
        {
          text: faker.lorem.sentence()
        }
      ]
    }
  ],
  status: EventStatus.Scheduled,
  location: 'Basel',
  image,
  tags: [
    {
      id: faker.string.uuid(),
      tag: 'Concert',
      __typename: 'Tag'
    }
  ],
  startsAt: faker.date.past().toISOString(),
  endsAt: faker.date.past().toISOString(),
  url: faker.internet.url(),
  __typename: 'Event'
}
