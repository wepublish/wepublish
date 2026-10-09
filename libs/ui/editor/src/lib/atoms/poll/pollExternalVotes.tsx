import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import {
  CreatePollExternalVoteSourceDocument,
  DeletePollExternalVoteSourceDocument,
  FullPollFragment,
  PollAnswer,
  PollExternalVote,
  PollExternalVoteSourceFragment,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Col, NumberInput, Row as RRow, Table } from 'rsuite';
import FormControl from 'rsuite/FormControl';
import { RowDataType } from 'rsuite-table';

import { humanizeError } from '../../humanizeError';
import { enqueueSnackbar } from '../../snackbar';
import { IconButtonTooltip } from '../iconButtonTooltip';

const Row = styled(RRow)`
  margin-top: 20px;
`;

interface ExternalVoteTableProps {
  poll: FullPollFragment | undefined;
  loading: boolean;
  onPollChange(poll: FullPollFragment): void;
  onClickDeleteBtn(voteSource: PollExternalVoteSourceFragment): void;
}

export function ExternalVoteTable({
  poll,
  loading,
  onPollChange,
  onClickDeleteBtn,
}: ExternalVoteTableProps) {
  const { t } = useTranslation();
  if (!poll?.externalVoteSources?.length) {
    return null;
  }

  function changeSource(
    answer: PollAnswer,
    externalVoteSource: PollExternalVoteSourceFragment,
    newAmount: string | number
  ) {
    if (!poll) {
      return;
    }

    const parsedAmount =
      typeof newAmount === 'string' ? parseInt(newAmount, 10) : newAmount;

    const updatedExternalVoteSources = (poll.externalVoteSources ?? []).map(
      src => {
        if (src.source !== externalVoteSource.source) {
          return src;
        }

        return {
          ...src,
          voteAmounts: (src.voteAmounts ?? []).map(vote =>
            vote.answerId === answer.id ?
              { ...vote, amount: parsedAmount }
            : vote
          ),
        };
      }
    );

    onPollChange({
      ...poll,
      externalVoteSources: updatedExternalVoteSources,
    });
  }

  /**
   * UI helper function
   */
  function iterateAnswerColumns() {
    return poll?.answers?.map((answer: PollAnswer) => (
      <Table.Column
        key={answer.id}
        width={150}
      >
        <Table.HeaderCell>{answer.answer}</Table.HeaderCell>
        <Table.Cell>
          {(
            externalVoteSource: RowDataType<PollExternalVoteSourceFragment>
          ) => (
            <NumberInput
              value={
                externalVoteSource.voteAmounts?.find(
                  (externalVote: PollExternalVote) =>
                    externalVote.answerId === answer.id
                )?.amount || 0
              }
              onChange={(newValue: string | number | null) => {
                changeSource(
                  answer,
                  externalVoteSource as PollExternalVoteSourceFragment,
                  newValue ?? 0
                );
              }}
            />
          )}
        </Table.Cell>
      </Table.Column>
    ));
  }

  return (
    <Table
      data={poll?.externalVoteSources || []}
      loading={loading}
      autoHeight
      rowHeight={64}
    >
      {/* source columns */}
      <Table.Column>
        <Table.HeaderCell>
          {t('pollExternalVotes.sourceHeaderCell')}
        </Table.HeaderCell>
        <Table.Cell>{(voteSource: any) => voteSource.source}</Table.Cell>
      </Table.Column>
      {iterateAnswerColumns()}
      {/* delete button */}
      <Table.Column
        width={100}
        align="center"
        fixed="right"
      >
        <Table.HeaderCell align="center">{t('action')}</Table.HeaderCell>
        <Table.Cell>
          {(voteSource: RowDataType<PollExternalVoteSourceFragment>) => (
            <IconButtonTooltip caption={t('delete')}>
              <IconButton
                size="small"
                color="error"
                aria-label={t('delete')}
                onClick={() =>
                  onClickDeleteBtn(voteSource as PollExternalVoteSourceFragment)
                }
              >
                <MdDelete />
              </IconButton>
            </IconButtonTooltip>
          )}
        </Table.Cell>
      </Table.Column>
    </Table>
  );
}

interface AddSourceProps {
  poll: FullPollFragment | undefined;
  setLoading(loading: boolean): void;
  onPollChange(poll: FullPollFragment): void;
}

export function AddSource({ poll, setLoading, onPollChange }: AddSourceProps) {
  const { t } = useTranslation();
  const [newSource, setNewSource] = useState<string | undefined>(undefined);

  const [createExternalVoteSource, { loading }] = useMutation(
    CreatePollExternalVoteSourceDocument
  );

  useEffect(() => {
    setLoading(loading);
  }, [loading]);

  const onErrorToast = (error: Error) => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };

  async function createPoll() {
    if (!newSource) {
      enqueueSnackbar(t('pollExternalVotes.emptySource'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
      return;
    }
    if (!poll) {
      enqueueSnackbar(t('pollExternalVotes.noPollAvailable'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
      return;
    }

    const createdSource = await createExternalVoteSource({
      variables: {
        pollId: poll.id,
        source: newSource,
      },
      onError: onErrorToast,
    });
    const source = createdSource?.data?.createPollExternalVoteSource;
    if (!source) {
      return;
    }

    const updatedPoll: FullPollFragment = {
      ...poll,
      externalVoteSources: [...(poll.externalVoteSources ?? []), source],
    };
    onPollChange(updatedPoll);
    setNewSource(undefined);
  }
  return (
    <Row>
      <Col xs={12}>
        <FormControl
          name="addNewSource"
          placeholder={t('pollExternalVotes.newSourcePlaceholder')}
          value={newSource || ''}
          onChange={setNewSource}
        />
      </Col>
      <Col xs={12}>
        <Button
          variant="contained"
          startIcon={<MdAdd />}
          onClick={createPoll}
        >
          {t('pollExternalVotes.addSourceBtn')}
        </Button>
      </Col>
    </Row>
  );
}

interface DeleteModalProps {
  poll: FullPollFragment | undefined;
  sourceToDelete: PollExternalVoteSourceFragment | undefined;
  openModal: boolean;
  closeModal(): void;
  onPollChange(poll: FullPollFragment): void;
}

export function DeleteModal({
  poll,
  sourceToDelete,
  openModal,
  closeModal,
  onPollChange,
}: DeleteModalProps) {
  const { t } = useTranslation();

  const [deleteExternalVoteSource] = useMutation(
    DeletePollExternalVoteSourceDocument,
    {}
  );

  async function deletePoll() {
    const id = sourceToDelete?.id;

    if (!id || !poll?.externalVoteSources) {
      return;
    }

    const deletedSource = await deleteExternalVoteSource({
      variables: {
        deletePollExternalVoteSourceId: id,
      },
    });
    const source = deletedSource?.data?.deletePollExternalVoteSource;

    if (!source || !poll?.externalVoteSources) {
      return;
    }

    const updatedPoll: FullPollFragment = {
      ...poll,
      externalVoteSources: poll.externalVoteSources.filter(
        tmpSource => tmpSource.id !== source.id
      ),
    };

    onPollChange(updatedPoll);
    closeModal();
  }

  return (
    <Dialog open={openModal}>
      <DialogTitle>{t('pollExternalVotes.deleteTitle')}</DialogTitle>
      <DialogContent>
        {t('pollExternalVotes.deleteBody', { source: sourceToDelete?.source })}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={async () => {
            await deletePoll();
          }}
        >
          {t('pollExternalVotes.deleteExternalVoteBtn')}
        </Button>
        <Button
          variant="text"
          onClick={() => {
            closeModal();
          }}
        >
          {t('cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface PollExternalVotesProps {
  poll?: FullPollFragment;
  onPollChange(poll: FullPollFragment): void;
}
export function PollExternalVotes({
  poll,
  onPollChange,
}: PollExternalVotesProps) {
  const [sourceToDelete, setSourceToDelete] = useState<
    PollExternalVoteSourceFragment | undefined
  >(undefined);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <>
      <ExternalVoteTable
        poll={poll}
        loading={loading}
        onPollChange={onPollChange}
        onClickDeleteBtn={(voteSource: PollExternalVoteSourceFragment) => {
          setOpenModal(true);
          setSourceToDelete(voteSource);
        }}
      />
      <AddSource
        poll={poll}
        setLoading={setLoading}
        onPollChange={onPollChange}
      />
      <DeleteModal
        poll={poll}
        sourceToDelete={sourceToDelete}
        openModal={openModal}
        closeModal={() => {
          setOpenModal(false);
          setSourceToDelete(undefined);
        }}
        onPollChange={onPollChange}
      />
    </>
  );
}
