import {faker} from '@faker-js/faker'
import {Node} from 'slate'

export const text: Node[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: faker.lorem.sentence(10)
      }
    ]
  }
]
