import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton as MuiIconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  CreatePollAnswerDocument,
  DeletePollAnswerDocument,
  FullPollFragment,
} from '@wepublish/editor/api';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';

import { humanizeError } from '../../humanizeError';
import { enqueueSnackbar } from '../../snackbar';
import { IconButtonTooltip } from '../iconButtonTooltip';

type PollAnswerFragment = FullPollFragment['answers'][number];
type PollExternalVoteFragment =
  FullPollFragment['externalVoteSources'][number]['voteAmounts'][number];

const IconButton = styled(MuiIconButton)`
  &&:not([data-with-text]) {
    width: 36px;
    height: 36px;
  }
`;

const Grid = styled.div`
  align-items: center;
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 12px;
  margin-bottom: 16px;
`;

const Hint = styled(FormHelperText)`
  && {
    display: block;
    margin-top: 12px;
  }
`;

function getTotalUserVotesByAnswerId(
  poll: FullPollFragment,
  answerId: string
): number {
  const answers = poll?.answers;
  if (!answers) {
    return 0;
  }
  return (
    answers
      .filter(answer => answer.id === answerId)
      .reduce((total, answer) => total + answer.votes, 0) || 0
  );
}

function getTotalExternalVotesByAnswerId(
  poll: FullPollFragment,
  answerId: string
): number {
  const externalVoteSources = poll?.externalVoteSources;
  if (!externalVoteSources) {
    return 0;
  }
  return (
    externalVoteSources.reduce(
      (total, voteSource) =>
        total +
        getTotalExternalVoteSourcesByAnswerId(answerId, voteSource.voteAmounts),
      0
    ) || 0
  );
}

function getTotalExternalVoteSourcesByAnswerId(
  answerId: string,
  pollExternalVotes?: PollExternalVoteFragment[] | null
): number {
  if (!pollExternalVotes) {
    return 0;
  }
  return (
    pollExternalVotes
      .filter(externalVote => externalVote.answerId === answerId)
      .reduce((total, externalVote) => total + (externalVote.amount ?? 0), 0) ||
    0
  );
}

function getTotalVotesByAnswerId(
  poll: FullPollFragment,
  answerId: string
): number {
  return (
    getTotalUserVotesByAnswerId(poll, answerId) +
    getTotalExternalVotesByAnswerId(poll, answerId)
  );
}

interface PollAnswersProps {
  poll?: FullPollFragment;
  onPollChange(poll: FullPollFragment): void;
}

export function PollAnswers({ poll, onPollChange }: PollAnswersProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [answerToDelete, setAnswerToDelete] = useState<
    PollAnswerFragment | undefined
  >(undefined);
  const [newAnswer, setNewAnswer] = useState<string>('');
  const [answerMissing, setAnswerMissing] = useState(false);
  const answerInputs = useRef(new Map<string, HTMLInputElement | null>());
  const newAnswerInput = useRef<HTMLInputElement>(null);
  const focusAfterDelete = useRef<string | null>(null);

  useEffect(() => {
    const pending = focusAfterDelete.current;

    if (pending === null) {
      return;
    }

    focusAfterDelete.current = null;
    (answerInputs.current.get(pending) ?? newAnswerInput.current)?.focus();
  }, [poll?.answers]);

  const [createAnswerMutation, { loading }] = useMutation(
    CreatePollAnswerDocument,
    {}
  );
  const [deleteAnswerMutation] = useMutation(DeletePollAnswerDocument);

  const onErrorToast = (error: Error) => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };

  /**
   * FUNCTIONS
   */
  async function createAnswer() {
    if (!poll) {
      return;
    }

    if (!newAnswer) {
      setAnswerMissing(true);
      newAnswerInput.current?.focus();
      return;
    }

    const answer = await createAnswerMutation({
      variables: {
        pollId: poll.id,
        answer: newAnswer,
      },
    });

    const savedAnswer = answer?.data?.createPollAnswer;

    if (savedAnswer) {
      const updatedPoll = { ...poll };
      updatedPoll.answers?.push(savedAnswer);
      onPollChange(updatedPoll);
    }

    setNewAnswer('');
  }

  async function deleteAnswer(): Promise<void> {
    setModalOpen(false);

    if (!answerToDelete) {
      return;
    }

    const answer = await deleteAnswerMutation({
      variables: {
        deletePollAnswerId: answerToDelete.id,
      },
      onError: onErrorToast,
    });

    const updatedPoll = {
      ...poll,
      answers: poll?.answers ? [...poll.answers] : [],
    } as FullPollFragment | undefined;

    // delete answer
    const deletedAnswer = answer?.data?.deletePollAnswer;
    if (!deletedAnswer || !updatedPoll?.answers) {
      return;
    }

    const deleteIndex = updatedPoll?.answers?.findIndex(
      tmpAnswer => tmpAnswer.id === deletedAnswer.id
    );

    if (deleteIndex < 0) {
      return;
    }

    const neighbour =
      updatedPoll.answers[deleteIndex + 1] ??
      updatedPoll.answers[deleteIndex - 1];

    focusAfterDelete.current = neighbour?.id ?? '';
    updatedPoll.answers.splice(deleteIndex, 1);

    // delete external vote sources
    updatedPoll.externalVoteSources?.forEach(tmpSource => {
      tmpSource.voteAmounts = tmpSource.voteAmounts?.filter(
        (tmpVoteAmount: PollExternalVoteFragment) =>
          tmpVoteAmount.answerId !== deletedAnswer.id
      );
    });

    onPollChange(updatedPoll);
  }

  async function updateAnswer(updatedAnswer: PollAnswerFragment) {
    if (!poll) {
      return;
    }

    const updatedAnswers = poll.answers ? [...poll.answers] : [];
    const answerIndex = updatedAnswers.findIndex(
      tempAnswer => tempAnswer.id === updatedAnswer.id
    );

    if (answerIndex < 0) {
      return;
    }

    updatedAnswers[answerIndex] = updatedAnswer;

    onPollChange({
      ...poll,
      answers: updatedAnswers,
    });
  }

  return (
    <>
      {poll?.answers?.map((answer, index) => (
        <Grid key={answer.id}>
          <TextField
            name={`answer-${answer.id}`}
            inputRef={(element: HTMLInputElement | null) => {
              answerInputs.current.set(answer.id, element);
            }}
            value={answer.answer}
            onChange={event => {
              updateAnswer({
                ...answer,
                answer: event.target.value,
              });
            }}
            slotProps={{
              htmlInput: {
                'aria-label': t('pollAnswer.answerLabel', {
                  number: index + 1,
                }),
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {`${getTotalVotesByAnswerId(poll, answer.id)} ${t(
                      'pollAnswer.votes'
                    )}`}
                  </InputAdornment>
                ),
              },
            }}
          />

          <IconButtonTooltip caption={t('delete')}>
            <IconButton
              aria-label={t('pollAnswer.deleteAnswer', {
                answer: answer.answer,
              })}
              size="small"
              color="error"
              onClick={() => {
                setAnswerToDelete(answer);
                setModalOpen(true);
              }}
            >
              <MdDelete />
            </IconButton>
          </IconButtonTooltip>
        </Grid>
      ))}

      <Hint>{t('pollAnswer.copyVoteUrlHint')}</Hint>

      <Grid css={{ marginTop: 24, marginBottom: 0 }}>
        <TextField
          name="createNewFormAnswer"
          inputRef={newAnswerInput}
          placeholder={t('pollAnswer.insertYourNewAnswer')}
          value={newAnswer}
          error={answerMissing}
          helperText={answerMissing ? t('pollAnswer.answerMissing') : undefined}
          slotProps={{
            htmlInput: { 'aria-label': t('pollAnswer.insertYourNewAnswer') },
          }}
          onChange={event => {
            setNewAnswer(event.target.value);
            setAnswerMissing(false);
          }}
        />

        <Button
          variant="contained"
          startIcon={<MdAdd />}
          loading={loading}
          onClick={createAnswer}
        >
          {t('pollEditView.addAndSaveNewAnswer')}
        </Button>
      </Grid>

      <Dialog
        fullWidth
        open={modalOpen}
        maxWidth="xs"
        onClose={() => {
          setModalOpen(false);
        }}
      >
        <DialogTitle>{t('pollAnswer.deleteModalTitle')}</DialogTitle>

        <DialogContent>
          {t('pollAnswer.deleteModalBody', { answer: answerToDelete?.answer })}
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setModalOpen(false)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={() => deleteAnswer()}
          >
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
