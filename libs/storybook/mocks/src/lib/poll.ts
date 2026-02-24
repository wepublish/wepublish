import { FullPollFragment, PollAnswer } from '@wepublish/website/api';
import { mockRichText } from './richtext';
import nanoid from 'nanoid';

export const mockPollAnswer = ({ votes = 1000, answer = 'Foobar' } = {}) =>
  ({
    __typename: 'PollAnswer',
    id: nanoid(),
    pollId: nanoid(),
    votes,
    answer,
  }) as PollAnswer;

export const mockPoll = ({
  infoText = mockRichText(),
  answers = [
    mockPollAnswer({ votes: 1300, answer: 'Bazfoo' }),
    mockPollAnswer(),
  ],
  closedAt = new Date('2023-01-01').toISOString(),
}: Partial<FullPollFragment> = {}): FullPollFragment =>
  ({
    __typename: 'FullPoll',
    id: nanoid(),
    externalVoteSources: [],
    opensAt: new Date('2023-01-01').toISOString(),
    closedAt,
    infoText,
    answers,
    question: 'Lorem Ipsum?',
  }) as FullPollFragment;
