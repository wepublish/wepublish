import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  CreatePollAnswerDocument,
  DeletePollAnswerDocument,
} from '@wepublish/editor/api';
import {
  type ItemLayoutProps,
  bindComponent,
  editorForm,
  useArrayField,
  useField,
  useFormView,
} from '@wepublish/form/editor';
import { IconButtonTooltip } from '@wepublish/ui/editor';
import { type KeyboardEvent, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';

import { type PollValues, pollSchema } from './poll.schema';
import { showMutationError, usePollId, useReloadPollRows } from './pollRows';

const AnswerItem = editorForm.fieldsFor(pollSchema, 'answers.*');

const Rows = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Line = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

type AnswerInputProps = {
  votes: number;
};

function AnswerInput({ votes }: AnswerInputProps) {
  const { t } = useTranslation();
  const { ref, ...field } = useField<string | null | undefined>();

  return (
    <TextField
      id={field.id}
      name={field.name}
      label={field.label}
      error={field.invalid}
      helperText={field.invalid ? field.error : undefined}
      disabled={field.disabled}
      placeholder={field.placeholder}
      fullWidth
      inputRef={ref}
      value={field.value ?? ''}
      onChange={event => field.onChange(event.target.value)}
      onBlur={field.onBlur}
      slotProps={{
        input: {
          readOnly: field.readOnly,
          endAdornment: (
            <InputAdornment position="end">
              {`${votes} ${t('pollAnswer.votes', { count: votes })}`}
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

const focusAnswerNear = (index: number) => {
  const answerAt = (position: number) =>
    document.querySelector<HTMLInputElement>(
      `input[name="answers.${position}.answer"]`
    );

  (
    answerAt(index) ??
    answerAt(index - 1) ??
    document.querySelector<HTMLInputElement>('input[name="newAnswer"]')
  )?.focus();
};

type DeleteAnswerDialogProps = {
  index: number;
  answerId: string;
  answer: string;
  open: boolean;
  onClose: () => void;
};

function DeleteAnswerDialog({
  index,
  answerId,
  answer,
  open,
  onClose,
}: DeleteAnswerDialogProps) {
  const { t } = useTranslation();
  const reload = useReloadPollRows();
  const [deleteAnswer, { loading }] = useMutation(DeletePollAnswerDocument);
  const [deleted, setDeleted] = useState(false);

  const confirm = async () => {
    try {
      await deleteAnswer({ variables: { deletePollAnswerId: answerId } });
    } catch (error) {
      showMutationError(error);
      onClose();

      return;
    }

    setDeleted(true);
    onClose();
    await reload();
    setTimeout(() => focusAnswerNear(index));
  };

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth="xs"
      disableRestoreFocus={deleted}
      onClose={onClose}
    >
      <DialogTitle>{t('pollAnswer.deleteModalTitle')}</DialogTitle>
      <DialogContent>
        {t('pollAnswer.deleteModalBody', { answer })}
      </DialogContent>
      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
          autoFocus
        >
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          loading={loading}
          onClick={confirm}
        >
          {t('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function PollAnswerRow({ index }: ItemLayoutProps) {
  const { t } = useTranslation();
  const { readOnly } = useFormView();
  const [open, setOpen] = useState(false);
  const [answerId, answer, votes] = useWatch<
    PollValues,
    [
      `answers.${number}.id`,
      `answers.${number}.answer`,
      `answers.${number}.votes`,
    ]
  >({
    name: [
      `answers.${index}.id`,
      `answers.${index}.answer`,
      `answers.${index}.votes`,
    ],
  });
  const sources = useWatch<PollValues, 'externalVoteSources'>({
    name: 'externalVoteSources',
  });
  const external = (sources ?? [])
    .flatMap(source => source?.voteAmounts ?? [])
    .filter(amount => amount?.answerId === answerId)
    .reduce((total, amount) => total + (amount?.amount ?? 0), 0);
  const total = (votes ?? 0) + external;

  return (
    <Line>
      <AnswerItem.Field
        name="answer"
        label={t('pollEditView.answerLabel', { position: index + 1 })}
        component={bindComponent(AnswerInput, { votes: total })}
      />
      {readOnly ? null : (
        <>
          <IconButtonTooltip caption={t('delete')}>
            <IconButton
              size="small"
              color="error"
              aria-label={t('pollEditView.deleteAnswer', {
                position: index + 1,
              })}
              onClick={() => setOpen(true)}
            >
              <MdDelete />
            </IconButton>
          </IconButtonTooltip>
          <DeleteAnswerDialog
            index={index}
            answerId={answerId ?? ''}
            answer={answer ?? ''}
            open={open}
            onClose={() => setOpen(false)}
          />
        </>
      )}
    </Line>
  );
}

function AddAnswer() {
  const { t } = useTranslation();
  const pollId = usePollId();
  const reload = useReloadPollRows();
  const [answer, setAnswer] = useState('');
  const [missing, setMissing] = useState(false);
  const [createAnswer, { loading }] = useMutation(CreatePollAnswerDocument);

  const add = async () => {
    if (!answer) {
      setMissing(true);

      return;
    }

    try {
      await createAnswer({ variables: { pollId, answer } });
    } catch (error) {
      showMutationError(error);

      return;
    }

    setAnswer('');
    await reload();
  };

  const addOnEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void add();
    }
  };

  return (
    <Line>
      <TextField
        name="newAnswer"
        label={t('pollAnswer.insertYourNewAnswer')}
        value={answer}
        error={missing}
        helperText={missing ? t('pollAnswer.answerMissing') : undefined}
        onChange={event => {
          setAnswer(event.target.value);
          setMissing(false);
        }}
        onKeyDown={addOnEnter}
      />
      <Button
        variant="outlined"
        startIcon={<MdAdd />}
        loading={loading}
        onClick={add}
      >
        {t('pollEditView.addAndSaveNewAnswer')}
      </Button>
    </Line>
  );
}

export function PollAnswers() {
  const list = useArrayField();

  return (
    <Rows>
      <Rows
        role="group"
        aria-label={typeof list.label === 'string' ? list.label : undefined}
      >
        {list.items.map(item => (
          <div key={item.key}>{list.renderItem(item.index)}</div>
        ))}
      </Rows>
      {list.readOnly ? null : <AddAnswer />}
    </Rows>
  );
}
