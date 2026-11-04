import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  CreatePollExternalVoteSourceDocument,
  DeletePollExternalVoteSourceDocument,
} from '@wepublish/editor/api';
import {
  type ItemLayoutProps,
  editorForm,
  useArrayField,
  useFormView,
} from '@wepublish/form/editor';
import { IconButtonTooltip } from '@wepublish/ui/editor';
import { type KeyboardEvent, createContext, useContext, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDeleteOutline } from 'react-icons/md';

import { type PollValues, pollSchema } from './poll.schema';
import { showMutationError, usePollId, useReloadPollRows } from './pollRows';

const SourceItem = editorForm.fieldsFor(pollSchema, 'externalVoteSources.*');
const AmountItem = editorForm.fieldsFor(
  pollSchema,
  'externalVoteSources.*.voteAmounts.*'
);

const SourceIndex = createContext(0);

const Rows = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const Source = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SourceHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Amounts = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
`;

const AddLine = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

type DeleteSourceDialogProps = {
  sourceId: string;
  source: string;
  open: boolean;
  onClose: () => void;
};

function DeleteSourceDialog({
  sourceId,
  source,
  open,
  onClose,
}: DeleteSourceDialogProps) {
  const { t } = useTranslation();
  const reload = useReloadPollRows();
  const [deleteSource, { loading }] = useMutation(
    DeletePollExternalVoteSourceDocument
  );

  const confirm = async () => {
    try {
      await deleteSource({
        variables: { deletePollExternalVoteSourceId: sourceId },
      });
    } catch (error) {
      showMutationError(error);
      onClose();

      return;
    }

    onClose();
    await reload();
  };

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth="xs"
      onClose={onClose}
    >
      <DialogTitle>{t('pollExternalVotes.deleteTitle')}</DialogTitle>
      <DialogContent>
        {t('pollExternalVotes.deleteBody', { source })}
      </DialogContent>
      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          loading={loading}
          onClick={confirm}
        >
          {t('pollExternalVotes.deleteExternalVoteBtn')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ExternalVoteAmountRow({ index }: ItemLayoutProps) {
  const sourceIndex = useContext(SourceIndex);
  const answerId = useWatch<
    PollValues,
    `externalVoteSources.${number}.voteAmounts.${number}.answerId`
  >({
    name: `externalVoteSources.${sourceIndex}.voteAmounts.${index}.answerId`,
  });
  const answers = useWatch<PollValues, 'answers'>({ name: 'answers' });
  const answer = (answers ?? []).find(item => item?.id === answerId);

  return (
    <AmountItem.Field
      name="amount"
      label={answer?.answer ?? ''}
    />
  );
}

export function ExternalVoteAmounts() {
  const list = useArrayField();

  return (
    <Amounts>
      {list.items.map(item => (
        <div key={item.key}>{list.renderItem(item.index)}</div>
      ))}
    </Amounts>
  );
}

export function ExternalVoteSourceRow({ index }: ItemLayoutProps) {
  const { t } = useTranslation();
  const { readOnly } = useFormView();
  const [open, setOpen] = useState(false);
  const [sourceId, source] = useWatch<
    PollValues,
    [
      `externalVoteSources.${number}.id`,
      `externalVoteSources.${number}.source`,
    ]
  >({
    name: [
      `externalVoteSources.${index}.id`,
      `externalVoteSources.${index}.source`,
    ],
  });
  const headingId = `poll-external-source-${index}`;

  return (
    <Source
      role="group"
      aria-labelledby={headingId}
    >
      <SourceHeader>
        <Typography
          id={headingId}
          variant="subtitle2"
          component="h3"
        >
          {source}
        </Typography>
        {readOnly ? null : (
          <IconButtonTooltip caption={t('delete')}>
            <IconButton
              size="small"
              aria-label={t('pollEditView.deleteSource', {
                source: source ?? '',
              })}
              onClick={() => setOpen(true)}
            >
              <MdDeleteOutline />
            </IconButton>
          </IconButtonTooltip>
        )}
      </SourceHeader>
      <SourceIndex.Provider value={index}>
        <SourceItem.Field name="voteAmounts" />
      </SourceIndex.Provider>
      {readOnly ? null : (
        <DeleteSourceDialog
          sourceId={sourceId ?? ''}
          source={source ?? ''}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </Source>
  );
}

function AddSource() {
  const { t } = useTranslation();
  const pollId = usePollId();
  const reload = useReloadPollRows();
  const [source, setSource] = useState('');
  const [missing, setMissing] = useState(false);
  const [createSource, { loading }] = useMutation(
    CreatePollExternalVoteSourceDocument
  );

  const add = async () => {
    if (!source) {
      setMissing(true);

      return;
    }

    try {
      await createSource({ variables: { pollId, source } });
    } catch (error) {
      showMutationError(error);

      return;
    }

    setSource('');
    await reload();
  };

  const addOnEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void add();
    }
  };

  return (
    <AddLine>
      <TextField
        label={t('pollExternalVotes.newSourcePlaceholder')}
        value={source}
        error={missing}
        helperText={missing ? t('pollExternalVotes.emptySource') : undefined}
        onChange={event => {
          setSource(event.target.value);
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
        {t('pollExternalVotes.addSourceBtn')}
      </Button>
    </AddLine>
  );
}

export function ExternalVoteSources() {
  const list = useArrayField();

  return (
    <Rows>
      {list.count === 0 ? null : (
        <Rows
          role="group"
          aria-label={typeof list.label === 'string' ? list.label : undefined}
        >
          {list.items.map(item => (
            <div key={item.key}>{list.renderItem(item.index)}</div>
          ))}
        </Rows>
      )}
      {list.readOnly ? null : <AddSource />}
    </Rows>
  );
}
