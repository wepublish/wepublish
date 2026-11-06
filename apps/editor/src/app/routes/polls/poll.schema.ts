import type {
  FullPollFragment,
  UpdatePollMutationVariables,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

const pollAnswer = z.object({
  id: z.string(),
  votes: z.number(),
  answer: z.string().nullish(),
});

const voteAmount = z.object({
  id: z.string(),
  answerId: z.string(),
  amount: z.number().int().min(0),
});

const externalVoteSource = z.object({
  id: z.string(),
  source: z.string().nullish(),
  voteAmounts: z.array(voteAmount),
});

export const pollSchema = z.object({
  question: z
    .string()
    .min(1)
    .meta({ label: 'pollEditView.questionPanelHeader' }),
  infoText: formFields.richText().nullish().meta({
    label: 'pollEditView.infoText',
    description: 'pollEditView.infoTextInfo',
  }),
  opensAt: formFields
    .dateTime()
    .meta({ label: 'pollEditView.opensAtLabel' }),
  closedAt: formFields.dateTime().nullish().meta({
    label: 'pollEditView.closesAtLabel',
    description: 'pollEditView.closesAtInfo',
  }),
  answers: z
    .array(pollAnswer)
    .meta({ label: 'pollEditView.answerPanelHeader' }),
  externalVoteSources: z
    .array(externalVoteSource)
    .meta({ label: 'pollEditView.pollExternalVotesPanelHeader' }),
});

export type PollValues = FormValues<typeof pollSchema>;

export const fromPollRows = (poll: FullPollFragment) => ({
  answers: poll.answers.map(({ id, votes, answer }) => ({
    id,
    votes,
    answer,
  })),
  externalVoteSources: poll.externalVoteSources.map(
    ({ id, source, voteAmounts }) => ({
      id,
      source,
      voteAmounts: voteAmounts.map(({ id, answerId, amount }) => ({
        id,
        answerId,
        amount,
      })),
    })
  ),
});

export const fromPoll = (
  poll: FullPollFragment
): FormDefaultValues<typeof pollSchema> => ({
  question: poll.question ?? '',
  infoText: poll.infoText,
  opensAt: new Date(poll.opensAt),
  closedAt: poll.closedAt ? new Date(poll.closedAt) : null,
  ...fromPollRows(poll),
});

export const pollTitleParams = ({ question }: PollValues) => ({
  question: question || '…',
});

type Current = Pick<PollValues, 'answers' | 'externalVoteSources'>;

export const keepUnsavedRows = (
  saved: ReturnType<typeof fromPollRows>,
  current: Current
) => {
  const answers = new Map(
    (current.answers ?? []).map(answer => [answer?.id, answer])
  );
  const amounts = new Map(
    (current.externalVoteSources ?? [])
      .flatMap(source => source?.voteAmounts ?? [])
      .map(amount => [amount?.id, amount])
  );

  return {
    answers: saved.answers.map(answer =>
      answers.has(answer.id) ?
        { ...answer, answer: answers.get(answer.id)?.answer ?? null }
      : answer
    ),
    externalVoteSources: saved.externalVoteSources.map(source => ({
      ...source,
      voteAmounts: source.voteAmounts.map(amount =>
        amounts.has(amount.id) ?
          { ...amount, amount: amounts.get(amount.id)?.amount ?? null }
        : amount
      ),
    })),
  };
};

export const toUpdatePollVariables = (
  id: string,
  values: FormOutput<typeof pollSchema>
): UpdatePollMutationVariables => ({
  id,
  question: values.question,
  infoText: values.infoText ?? null,
  opensAt: values.opensAt.toISOString(),
  closedAt: values.closedAt?.toISOString() ?? null,
  answers: values.answers.map(({ id, answer }) => ({
    id,
    answer: answer ?? null,
  })),
  externalVoteSources: values.externalVoteSources.map(
    ({ id, source, voteAmounts }) => ({
      id,
      source,
      voteAmounts: voteAmounts.map(({ id, amount }) => ({ id, amount })),
    })
  ),
});
