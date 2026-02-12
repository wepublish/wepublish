import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  FullPoll,
  getApiClientV2,
  PollAnswer,
  PollExternalVote,
  PollExternalVoteSource,
  useCreatePollExternalVoteSourceMutation,
  useDeletePollExternalVoteSourceMutation,
} from '@wepublish/editor/api-v2';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import {
  Button,
  Col,
  IconButton,
  InputNumber,
  Message,
  Modal,
  Row as RRow,
  Table,
  toaster,
} from 'rsuite';
import FormControl from 'rsuite/FormControl';
import { RowDataType } from 'rsuite-table';

const Row = styled(RRow)`
  margin-top: 20px;
`;

interface ExternalVoteTableProps {
  poll: FullPoll | undefined;
  loading: boolean;
  onPollChange(poll: FullPoll): void;
  onClickDeleteBtn(voteSource: PollExternalVoteSource): void;
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
    externalVoteSource: PollExternalVoteSource,
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
          {(externalVoteSource: RowDataType<PollExternalVoteSource>) => (
            <InputNumber
              value={
                externalVoteSource.voteAmounts?.find(
                  (externalVote: PollExternalVote) =>
                    externalVote.answerId === answer.id
                )?.amount || 0
              }
              onChange={(newValue: string | number) => {
                changeSource(
                  answer,
                  externalVoteSource as PollExternalVoteSource,
                  newValue
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
      <Table.Column>
        <Table.HeaderCell>{t('delete')}</Table.HeaderCell>
        <Table.Cell>
          {(voteSource: RowDataType<PollExternalVoteSource>) => (
            <IconButton
              icon={<MdDelete />}
              onClick={() =>
                onClickDeleteBtn(voteSource as PollExternalVoteSource)
              }
            />
          )}
        </Table.Cell>
      </Table.Column>
    </Table>
  );
}

interface AddSourceProps {
  poll: FullPoll | undefined;
  setLoading(loading: boolean): void;
  onPollChange(poll: FullPoll): void;
}

export function AddSource({ poll, setLoading, onPollChange }: AddSourceProps) {
  const { t } = useTranslation();
  const [newSource, setNewSource] = useState<string | undefined>(undefined);

  const client = getApiClientV2();
  const [createExternalVoteSource, { loading }] =
    useCreatePollExternalVoteSourceMutation({ client });

  useEffect(() => {
    setLoading(loading);
  }, [loading]);

  const onErrorToast = (error: ApolloError) => {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error.message}
      </Message>
    );
  };

  async function createPoll() {
    if (!newSource) {
      toaster.push(
        <Message
          showIcon
          type="error"
          closable
          duration={3000}
        >
          {t('pollExternalVotes.emptySource')}
        </Message>
      );
      return;
    }
    if (!poll) {
      toaster.push(
        <Message
          showIcon
          type="error"
          closable
          duration={3000}
        >
          {t('pollExternalVotes.noPollAvailable')}
        </Message>
      );
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

    const updatedPoll: FullPoll = {
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
        <IconButton
          icon={<MdAdd />}
          appearance="primary"
          onClick={createPoll}
        >
          {t('pollExternalVotes.addSourceBtn')}
        </IconButton>
      </Col>
    </Row>
  );
}

interface DeleteModalProps {
  poll: FullPoll | undefined;
  sourceToDelete: PollExternalVoteSource | undefined;
  openModal: boolean;
  closeModal(): void;
  onPollChange(poll: FullPoll): void;
}

export function DeleteModal({
  poll,
  sourceToDelete,
  openModal,
  closeModal,
  onPollChange,
}: DeleteModalProps) {
  const { t } = useTranslation();
  const client = getApiClientV2();
  const [deleteExternalVoteSource] = useDeletePollExternalVoteSourceMutation({
    client,
  });

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

    const updatedPoll: FullPoll = {
      ...poll,
      externalVoteSources: poll.externalVoteSources.filter(
        tmpSource => tmpSource.id !== source.id
      ),
    };

    onPollChange(updatedPoll);
    closeModal();
  }

  return (
    <Modal open={openModal}>
      <Modal.Title>{t('pollExternalVotes.deleteTitle')}</Modal.Title>
      <Modal.Body>
        {t('pollExternalVotes.deleteBody', { source: sourceToDelete?.source })}
      </Modal.Body>
      <Modal.Footer>
        <Button
          appearance="primary"
          onClick={async () => {
            await deletePoll();
          }}
        >
          {t('pollExternalVotes.deleteExternalVoteBtn')}
        </Button>
        <Button
          appearance="subtle"
          onClick={() => {
            closeModal();
          }}
        >
          {t('cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

interface PollExternalVotesProps {
  poll?: FullPoll;
  onPollChange(poll: FullPoll): void;
}
export function PollExternalVotes({
  poll,
  onPollChange,
}: PollExternalVotesProps) {
  const [sourceToDelete, setSourceToDelete] = useState<
    PollExternalVoteSource | undefined
  >(undefined);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <>
      <ExternalVoteTable
        poll={poll}
        loading={loading}
        onPollChange={onPollChange}
        onClickDeleteBtn={(voteSource: PollExternalVoteSource) => {
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
