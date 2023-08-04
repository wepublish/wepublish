import {faker} from '@faker-js/faker'
import {Exact, FullPollFragment} from '@wepublish/website/api'

export const poll: Exact<FullPollFragment> = {
  __typename: 'FullPoll',
  id: faker.string.uuid(),
  question: 'Question',
  infoText: [
    {
      type: 'paragraph',
      children: [
        {
          text: faker.lorem.words()
        }
      ]
    }
  ],
  externalVoteSources: [
    {
      id: faker.string.uuid(),
      voteAmounts: [
        {
          id: '1',
          __typename: 'PollExternalVote',
          amount: 10,
          answerId: faker.number.int().toString()
        },
        {
          id: '2',
          __typename: 'PollExternalVote',
          amount: 5,
          answerId: faker.number.int().toString()
        }
      ]
    }
  ],
  opensAt: faker.date.past().toISOString(),
  closedAt: faker.date.future({years: 10}).toISOString(),
  answers: [
    {
      id: faker.number.int().toString(),
      pollId: faker.number.int().toString(),
      votes: 1,
      answer: 'Ja'
    },
    {
      id: faker.number.int().toString(),
      pollId: faker.number.int().toString(),
      votes: 5,
      answer: 'Nein'
    }
  ]
}
