import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  DeletePollAnswerDocument,
  FullPollFragment,
} from '@wepublish/editor/api';
import { useState } from 'react';

import { enqueueSnackbar } from '../../snackbar';
import { PollAnswers } from './pollAnswers';

const createAnswer = vi.hoisted(() => vi.fn());

vi.mock('@apollo/client/react', () => ({
  useMutation: (document: unknown) => [
    document === DeletePollAnswerDocument ?
      ({ variables }: { variables: { deletePollAnswerId: string } }) =>
        Promise.resolve({
          data: { deletePollAnswer: { id: variables.deletePollAnswerId } },
        })
    : createAnswer,
    { loading: false },
  ],
}));

vi.mock('../../snackbar', () => ({ enqueueSnackbar: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${Object.values(options).join(' ')}` : key,
  }),
}));

const poll = {
  id: 'poll-1',
  answers: [
    { id: 'a1', answer: 'Yes', votes: 1 },
    { id: 'a2', answer: 'No', votes: 2 },
    { id: 'a3', answer: 'Maybe', votes: 0 },
  ],
  externalVoteSources: [],
} as unknown as FullPollFragment;

function Answers({ initial = poll }: { initial?: FullPollFragment }) {
  const [current, setCurrent] = useState(initial);

  return (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <PollAnswers
        poll={current}
        onPollChange={setCurrent}
      />
    </ThemeProvider>
  );
}

describe('PollAnswers', () => {
  it('names every answer field and says which answer each delete button removes', () => {
    render(<Answers />);

    expect(
      screen.getByRole('textbox', { name: 'pollAnswer.answerLabel 2' })
    ).toHaveValue('No');
    expect(
      screen.getByRole('button', { name: 'pollAnswer.deleteAnswer No' })
    ).toBeTruthy();
  });

  it('names the new answer field', () => {
    render(<Answers />);

    expect(
      screen.getByRole('textbox', { name: 'pollAnswer.insertYourNewAnswer' })
    ).toBeTruthy();
  });

  it('marks the new answer field invalid and focuses it when it is empty', () => {
    render(<Answers />);

    fireEvent.click(
      screen.getByRole('button', { name: 'pollEditView.addAndSaveNewAnswer' })
    );

    const field = screen.getByRole('textbox', {
      name: 'pollAnswer.insertYourNewAnswer',
    });

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('pollAnswer.answerMissing');
    expect(document.activeElement).toBe(field);
    expect(createAnswer).not.toHaveBeenCalled();
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  it('moves focus to the next answer after one is deleted', async () => {
    render(<Answers />);

    fireEvent.click(
      screen.getByRole('button', { name: 'pollAnswer.deleteAnswer No' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'delete',
      })
    );

    await waitFor(() => expect(screen.queryByDisplayValue('No')).toBeNull());
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByDisplayValue('Maybe'))
    );
  });

  it('moves focus to the new answer field once the last answer is deleted', async () => {
    render(
      <Answers
        initial={
          {
            ...poll,
            answers: [{ id: 'a1', answer: 'Yes', votes: 0 }],
          } as unknown as FullPollFragment
        }
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'pollAnswer.deleteAnswer Yes' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'delete',
      })
    );

    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('textbox', {
          name: 'pollAnswer.insertYourNewAnswer',
        })
      )
    );
  });
});
