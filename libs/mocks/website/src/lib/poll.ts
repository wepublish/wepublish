import { FullPollFragment } from '@wepublish/website/api';
import { mockRichText } from './richtext';
import { faker, MOCK_REFERENCE_DATE } from './faker';
import { definedOnly } from './overrides';

type PollAnswer = FullPollFragment['answers'][number];

export const mockPollAnswer = (
  overrides: Partial<PollAnswer> = {}
): PollAnswer => ({
  __typename: 'PollAnswer',
  id: faker.string.nanoid(),
  pollId: faker.string.nanoid(),
  votes: 1000,
  answer: 'Foobar',
  ...definedOnly(overrides),
});

export const mockPoll = ({
  id = faker.string.nanoid(),
  infoText = mockRichText(),
  answers = [
    mockPollAnswer({ pollId: id, votes: 1300, answer: 'Bazfoo' }),
    mockPollAnswer({ pollId: id }),
  ],
  ...overrides
}: Partial<FullPollFragment> = {}): FullPollFragment => ({
  __typename: 'FullPoll',
  id,
  question: 'Lorem Ipsum?',
  opensAt: MOCK_REFERENCE_DATE,
  closedAt: MOCK_REFERENCE_DATE,
  externalVoteSources: [],
  infoText,
  answers,
  ...definedOnly(overrides),
});
