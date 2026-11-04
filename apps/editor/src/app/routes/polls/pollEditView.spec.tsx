import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type CreatePollAnswerMutation,
  type CreatePollAnswerMutationVariables,
  type CreatePollExternalVoteSourceMutation,
  type CreatePollExternalVoteSourceMutationVariables,
  type DeletePollAnswerMutation,
  type DeletePollAnswerMutationVariables,
  type DeletePollExternalVoteSourceMutation,
  type DeletePollExternalVoteSourceMutationVariables,
  type FullPollFragment,
  type PollQuery,
  type UpdatePollMutation,
  type UpdatePollMutationVariables,
  CreatePollAnswerDocument,
  CreatePollExternalVoteSourceDocument,
  DeletePollAnswerDocument,
  DeletePollExternalVoteSourceDocument,
  PollDocument,
  UpdatePollDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import { CanGetPoll, CanUpdatePoll } from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

import { PollEditForm, PollEditView } from './pollEditView';

const editor: AuthContextState = {
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'poll-editor',
        name: 'poll-editor',
        description: null,
        systemRole: false,
        permissions: [CanGetPoll, CanUpdatePoll].map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
};

type Answer = FullPollFragment['answers'][number];
type Source = FullPollFragment['externalVoteSources'][number];

const answerOf = (id: string, answer: string, votes: number): Answer => ({
  __typename: 'PollAnswer',
  id,
  pollId: 'poll-1',
  answer,
  votes,
});

const voteOf = (id: string, answerId: string, amount: number) => ({
  __typename: 'PollExternalVote' as const,
  id,
  answerId,
  amount,
});

const loadedPoll: FullPollFragment = {
  __typename: 'FullPoll',
  id: 'poll-1',
  question: 'Lieblingsfarbe?',
  opensAt: '2026-01-01T10:00:00.000Z',
  closedAt: null,
  infoText: null,
  answers: [
    answerOf('answer-red', 'Rot', 3),
    answerOf('answer-blue', 'Blau', 1),
  ],
  externalVoteSources: [
    {
      __typename: 'PollExternalVoteSource',
      id: 'source-fb',
      source: 'Facebook',
      voteAmounts: [
        voteOf('vote-fb-red', 'answer-red', 2),
        voteOf('vote-fb-blue', 'answer-blue', 0),
      ],
    },
  ],
};

const unchangedVariables = {
  id: 'poll-1',
  question: 'Lieblingsfarbe?',
  infoText: null,
  opensAt: '2026-01-01T10:00:00.000Z',
  closedAt: null,
  answers: [
    { id: 'answer-red', answer: 'Rot' },
    { id: 'answer-blue', answer: 'Blau' },
  ],
  externalVoteSources: [
    {
      id: 'source-fb',
      source: 'Facebook',
      voteAmounts: [
        { id: 'vote-fb-red', amount: 2 },
        { id: 'vote-fb-blue', amount: 0 },
      ],
    },
  ],
};

let server: FullPollFragment = loadedPoll;

const sent = vi.fn<(variables: UpdatePollMutationVariables) => void>();
const createdAnswers =
  vi.fn<(variables: CreatePollAnswerMutationVariables) => void>();
const deletedAnswers =
  vi.fn<(variables: DeletePollAnswerMutationVariables) => void>();
const createdSources =
  vi.fn<(variables: CreatePollExternalVoteSourceMutationVariables) => void>();
const deletedSources =
  vi.fn<(variables: DeletePollExternalVoteSourceMutationVariables) => void>();

const pollQuery: MockLink.MockedResponse = {
  request: { query: PollDocument, variables: { id: 'poll-1' } },
  result: () => {
    const data: PollQuery = { __typename: 'Query', poll: server };

    return { data };
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const updatePoll: MockLink.MockedResponse = {
  request: { query: UpdatePollDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdatePollMutationVariables) => {
    sent(JSON.parse(JSON.stringify(variables)));

    const data: UpdatePollMutation = {
      __typename: 'Mutation',
      updatePoll: server,
    };

    return { data };
  },
};

const createAnswer: MockLink.MockedResponse = {
  request: { query: CreatePollAnswerDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreatePollAnswerMutationVariables) => {
    createdAnswers(variables);

    const answer = answerOf('answer-green', variables.answer ?? '', 0);

    server = {
      ...server,
      answers: [...server.answers, answer],
      externalVoteSources: server.externalVoteSources.map(source => ({
        ...source,
        voteAmounts: [
          ...source.voteAmounts,
          voteOf(`${source.id}-green`, answer.id, 0),
        ],
      })),
    };

    const data: CreatePollAnswerMutation = {
      __typename: 'Mutation',
      createPollAnswer: answer,
    };

    return { data };
  },
};

const deleteAnswer: MockLink.MockedResponse = {
  request: { query: DeletePollAnswerDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: DeletePollAnswerMutationVariables) => {
    deletedAnswers(variables);

    const id = variables.deletePollAnswerId;

    server = {
      ...server,
      answers: server.answers.filter(answer => answer.id !== id),
      externalVoteSources: server.externalVoteSources.map(source => ({
        ...source,
        voteAmounts: source.voteAmounts.filter(vote => vote.answerId !== id),
      })),
    };

    const data: DeletePollAnswerMutation = {
      __typename: 'Mutation',
      deletePollAnswer: { __typename: 'PollAnswer', id },
    };

    return { data };
  },
};

const createSource: MockLink.MockedResponse = {
  request: {
    query: CreatePollExternalVoteSourceDocument,
    variables: () => true,
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreatePollExternalVoteSourceMutationVariables) => {
    createdSources(variables);

    const source: Source = {
      __typename: 'PollExternalVoteSource',
      id: 'source-print',
      source: variables.source ?? null,
      voteAmounts: server.answers.map(answer =>
        voteOf(`print-${answer.id}`, answer.id, 0)
      ),
    };

    server = {
      ...server,
      externalVoteSources: [...server.externalVoteSources, source],
    };

    const data: CreatePollExternalVoteSourceMutation = {
      __typename: 'Mutation',
      createPollExternalVoteSource: source,
    };

    return { data };
  },
};

const deleteSource: MockLink.MockedResponse = {
  request: {
    query: DeletePollExternalVoteSourceDocument,
    variables: () => true,
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: DeletePollExternalVoteSourceMutationVariables) => {
    deletedSources(variables);

    const id = variables.deletePollExternalVoteSourceId;
    const [source] = server.externalVoteSources.filter(
      item => item.id === id
    );

    server = {
      ...server,
      externalVoteSources: server.externalVoteSources.filter(
        item => item.id !== id
      ),
    };

    const data: DeletePollExternalVoteSourceMutation = {
      __typename: 'Mutation',
      deletePollExternalVoteSource: source,
    };

    return { data };
  },
};

function Editor({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={editor}>{children}</AuthContext.Provider>
  );
}

const renderEdit = () =>
  renderFormRoutes(
    { '/polls/edit/:id': <PollEditView /> },
    {
      route: '/polls/edit/poll-1',
      wrapper: Editor,
      mocks: [
        pollQuery,
        updatePoll,
        createAnswer,
        deleteAnswer,
        createSource,
        deleteSource,
      ],
    }
  );

const question = () => getFieldByLabel(/^pollEditView\.questionPanelHeader/);

const answerFields = () =>
  screen.queryAllByRole('textbox', { name: /^pollEditView\.answerLabel/ });

const sourceGroup = (source: string) =>
  within(screen.getByRole('group', { name: source }));

const votesOf = (source: string, answer: string) =>
  sourceGroup(source).getByRole('spinbutton', {
    name: new RegExp(`^${answer}\\*?$`),
  });

const save = () => screen.getByTestId('saveButton');

const loaded = async () => {
  await waitFor(() => expect(question()).toHaveValue('Lieblingsfarbe?'));
};

const unloadBlocked = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

const sectionTitles = () =>
  screen
    .getAllByRole('region')
    .map(
      region =>
        document.getElementById(region.getAttribute('aria-labelledby') ?? '')
          ?.textContent
    );

beforeEach(() => {
  server = loadedPoll;
  sent.mockClear();
  createdAnswers.mockClear();
  deletedAnswers.mockClear();
  createdSources.mockClear();
  deletedSources.mockClear();
});

describe('PollEditView', () => {
  it('is memoised by the React Compiler', () => {
    expect(PollEditForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the loaded poll in titled sections', async () => {
    renderEdit();

    await loaded();

    expect(screen.getByText('pollEditView.title')).toBeInTheDocument();
    expect(sectionTitles()).toEqual([
      'pollEditView.sections.general',
      'pollEditView.answerPanelHeader',
      'pollEditView.pollExternalVotesPanelHeader',
      'pollEditView.sections.schedule',
    ]);
    expect(getFieldByLabel('pollEditView.questionPanelHeader*')).toBe(
      question()
    );
    expect(getFieldByLabel(/^pollEditView\.opensAtLabel/)).toHaveValue(
      '01.01.2026 10:00'
    );
    expect(getFieldByLabel(/^pollEditView\.closesAtLabel/)).toHaveValue('');
    expect(answerFields()[0]).toHaveValue('Rot');
    expect(answerFields()[1]).toHaveValue('Blau');
    expect(answerFields()).toHaveLength(2);
    expect(
      formSectionOf('pollEditView.answerPanelHeader').getByText(
        '5 pollAnswer.votes'
      )
    ).toBeInTheDocument();
    expect(
      formSectionOf('pollEditView.answerPanelHeader').getByText(
        '1 pollAnswer.votes'
      )
    ).toBeInTheDocument();
    expect(votesOf('Facebook', 'Rot')).toHaveValue(2);
    expect(votesOf('Facebook', 'Blau')).toHaveValue(0);
  });

  it('saves the loaded values and stays on the poll', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual(unchangedVariables);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/polls/edit/poll-1');
  });

  it('saves the edited question, answer texts and external votes', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.clear(question());
    await user.type(question(), 'Lieblingstier?');
    await user.clear(answerFields()[0]);
    await user.type(answerFields()[0], 'Katze');
    await user.clear(votesOf('Facebook', 'Blau'));
    await user.type(votesOf('Facebook', 'Blau'), '7');

    expect(
      formSectionOf('pollEditView.answerPanelHeader').getByText(
        '8 pollAnswer.votes'
      )
    ).toBeInTheDocument();

    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...unchangedVariables,
      question: 'Lieblingstier?',
      answers: [
        { id: 'answer-red', answer: 'Katze' },
        { id: 'answer-blue', answer: 'Blau' },
      ],
      externalVoteSources: [
        {
          id: 'source-fb',
          source: 'Facebook',
          voteAmounts: [
            { id: 'vote-fb-red', amount: 2 },
            { id: 'vote-fb-blue', amount: 7 },
          ],
        },
      ],
    });
  });

  it('requires a question', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.clear(question());
    await user.click(save());

    expect(
      await formSectionOf('pollEditView.sections.general').findByText(
        'form.errors.required'
      )
    ).toBeInTheDocument();
    expect(sent).not.toHaveBeenCalled();
  });

  it('refuses negative external votes', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.clear(votesOf('Facebook', 'Rot'));
    await user.type(votesOf('Facebook', 'Rot'), '-3');
    await user.click(save());

    await waitFor(() =>
      expect(votesOf('Facebook', 'Rot')).toHaveAttribute('aria-invalid', 'true')
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('creates an answer straight away and keeps unsaved edits', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.clear(question());
    await user.type(question(), 'Lieblingstier?');
    await user.type(
      getFieldByLabel('pollAnswer.insertYourNewAnswer'),
      'Grün{Enter}'
    );

    await waitFor(() => expect(answerFields()).toHaveLength(3));
    expect(createdAnswers).toHaveBeenCalledWith({
      pollId: 'poll-1',
      answer: 'Grün',
    });
    expect(sent).not.toHaveBeenCalled();
    expect(answerFields()[2]).toHaveValue('Grün');
    expect(getFieldByLabel('pollAnswer.insertYourNewAnswer')).toHaveValue('');
    expect(question()).toHaveValue('Lieblingstier?');
    expect(votesOf('Facebook', 'Grün')).toHaveValue(0);

    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...unchangedVariables,
      question: 'Lieblingstier?',
      answers: [
        { id: 'answer-red', answer: 'Rot' },
        { id: 'answer-blue', answer: 'Blau' },
        { id: 'answer-green', answer: 'Grün' },
      ],
      externalVoteSources: [
        {
          id: 'source-fb',
          source: 'Facebook',
          voteAmounts: [
            { id: 'vote-fb-red', amount: 2 },
            { id: 'vote-fb-blue', amount: 0 },
            { id: 'source-fb-green', amount: 0 },
          ],
        },
      ],
    });
  });

  it('leaves no unsaved changes after creating an answer', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.type(getFieldByLabel('pollAnswer.insertYourNewAnswer'), 'Grün');
    await user.click(
      screen.getByRole('button', { name: 'pollEditView.addAndSaveNewAnswer' })
    );

    await waitFor(() => expect(answerFields()).toHaveLength(3));
    expect(unloadBlocked()).toBe(false);
  });

  it('asks for the text of a new answer', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(
      screen.getByRole('button', { name: 'pollEditView.addAndSaveNewAnswer' })
    );

    expect(
      await screen.findByText('pollAnswer.answerMissing')
    ).toBeInTheDocument();
    expect(createdAnswers).not.toHaveBeenCalled();
  });

  it('deletes an answer straight away after confirming', async () => {
    const { user } = renderEdit();

    await loaded();
    const [deleteRed] = screen.getAllByRole('button', {
      name: 'pollEditView.deleteAnswer',
    });
    await user.click(deleteRed);
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'delete',
      })
    );

    await waitFor(() => expect(answerFields()).toHaveLength(1));
    expect(deletedAnswers).toHaveBeenCalledWith({
      deletePollAnswerId: 'answer-red',
    });
    expect(answerFields()[0]).toHaveValue('Blau');
    expect(
      sourceGroup('Facebook').queryByRole('spinbutton', { name: /^Rot/ })
    ).toBeNull();
    expect(unloadBlocked()).toBe(false);
    expect(sent).not.toHaveBeenCalled();
  });

  it('adds and deletes an external vote source straight away', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.type(
      getFieldByLabel('pollExternalVotes.newSourcePlaceholder'),
      'Print'
    );
    await user.click(
      screen.getByRole('button', { name: 'pollExternalVotes.addSourceBtn' })
    );

    await waitFor(() => expect(votesOf('Print', 'Rot')).toHaveValue(0));
    expect(createdSources).toHaveBeenCalledWith({
      pollId: 'poll-1',
      source: 'Print',
    });
    expect(unloadBlocked()).toBe(false);

    await user.click(
      sourceGroup('Facebook').getByRole('button', {
        name: 'pollEditView.deleteSource',
      })
    );
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'pollExternalVotes.deleteExternalVoteBtn',
      })
    );

    await waitFor(() =>
      expect(deletedSources).toHaveBeenCalledWith({
        deletePollExternalVoteSourceId: 'source-fb',
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() =>
      expect(screen.queryByRole('group', { name: 'Facebook' })).toBeNull()
    );
    expect(votesOf('Print', 'Rot')).toHaveValue(0);
    expect(unloadBlocked()).toBe(false);
    expect(sent).not.toHaveBeenCalled();
  });
});
