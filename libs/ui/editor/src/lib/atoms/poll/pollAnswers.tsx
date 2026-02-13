import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  FullPoll,
  PollAnswer,
  PollExternalVote,
  useCreatePollAnswerMutation,
  useDeletePollAnswerMutation,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdContentCopy, MdDelete } from 'react-icons/md';
import {
  Badge as RBadge,
  Button,
  Col as RCol,
  Form,
  IconButton as RIconButton,
  Message,
  Modal,
  Row as RRow,
  toaster,
  Tooltip,
  Whisper,
} from 'rsuite';

const IconButton = styled(RIconButton)`
  margin-right: 10px;
`;

const Badge = styled(RBadge)`
  width: 100%;
`;

const Col = styled(RCol)`
  padding-right: 30px;
`;

const Row = styled(RRow)`
  align-items: center;
`;

function getTotalUserVotesByAnswerId(poll: FullPoll, answerId: string): number {
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
  poll: FullPoll,
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
  pollExternalVotes?: PollExternalVote[] | null
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

function getTotalVotesByAnswerId(poll: FullPoll, answerId: string): number {
  return (
    getTotalUserVotesByAnswerId(poll, answerId) +
    getTotalExternalVotesByAnswerId(poll, answerId)
  );
}

interface PollAnswersProps {
  poll?: FullPoll;
  onPollChange(poll: FullPoll): void;
}

function generateUrlParams(answer: PollAnswer): undefined | string {
  if (!answer) {
    return undefined;
  }

  return `?answerId=${answer.id}`;
}

export function PollAnswers({ poll, onPollChange }: PollAnswersProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [answerToDelete, setAnswerToDelete] = useState<PollAnswer | undefined>(
    undefined
  );
  const [newAnswer, setNewAnswer] = useState<string>('');

  const [createAnswerMutation, { loading }] = useCreatePollAnswerMutation({});
  const [deleteAnswerMutation] = useDeletePollAnswerMutation();

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

  /**
   * FUNCTIONS
   */
  async function createAnswer() {
    if (!poll) {
      return;
    }
    if (!newAnswer) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={3000}
        >
          {t('pollAnswer.answerMissing')}
        </Message>
      );
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
      updatedPoll.answers?.push(savedAnswer as PollAnswer);
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
    } as FullPoll | undefined;
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

    updatedPoll.answers.splice(deleteIndex, 1);

    // delete external vote sources
    updatedPoll.externalVoteSources?.forEach(tmpSource => {
      tmpSource.voteAmounts = tmpSource.voteAmounts?.filter(
        (tmpVoteAmount: PollExternalVote) =>
          tmpVoteAmount.answerId !== deletedAnswer.id
      );
    });
    onPollChange(updatedPoll);
  }

  async function updateAnswer(updatedAnswer: PollAnswer) {
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

  async function copyUrlParamsIntoClipboard(answer: PollAnswer): Promise<void> {
    const urlParams = generateUrlParams(answer);

    if (!urlParams) {
      return;
    }

    try {
      await navigator.clipboard.writeText(urlParams);

      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('pollAnswer.urlCopied')}
        </Message>
      );
    } catch (e) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={3000}
        >
          {t('pollAnswer.urlCopyingFailed')}
        </Message>
      );
    }
  }

  return (
    <>
      <Row>
        {poll?.answers?.map(answer => (
          <div key={`answer-${answer.id}`}>
            <Col xs={16}>
              <Badge
                content={`${getTotalVotesByAnswerId(poll, answer.id)} ${t('pollAnswer.votes')}`}
              >
                <Form.Control
                  name={`answer-${answer.id}`}
                  value={answer.answer}
                  onChange={(value: string) => {
                    updateAnswer({
                      ...answer,
                      answer: value,
                    });
                  }}
                />
              </Badge>
            </Col>

            {/* copy link btn */}
            <RCol xs={8}>
              <IconButton
                icon={<MdDelete />}
                circle
                size="sm"
                appearance="ghost"
                color="red"
                onClick={() => {
                  setAnswerToDelete(answer);
                  setModalOpen(true);
                }}
              />
              <Whisper
                speaker={<Tooltip>{t('pollAnswer.copyVoteUrl')}</Tooltip>}
              >
                <RIconButton
                  icon={<MdContentCopy />}
                  circle
                  size="sm"
                  appearance="ghost"
                  onClick={() => copyUrlParamsIntoClipboard(answer)}
                />
              </Whisper>
            </RCol>
          </div>
        ))}
      </Row>

      {/* adding new poll answer */}
      <RRow>
        <RCol xs={16}>
          <Form.Control
            name="createNewFormAnswer"
            placeholder={t('pollAnswer.insertYourNewAnswer')}
            value={newAnswer}
            onChange={(value: string) => {
              setNewAnswer(value);
            }}
          />
        </RCol>

        <RCol xs={8}>
          <RIconButton
            icon={<MdAdd />}
            loading={loading}
            appearance="primary"
            onClick={createAnswer}
          >
            {t('pollEditView.addAndSaveNewAnswer')}
          </RIconButton>
        </RCol>
      </RRow>

      {/* delete modal */}
      <Modal
        open={modalOpen}
        size="xs"
        onClose={() => {
          setModalOpen(false);
        }}
      >
        <Modal.Title>{t('pollAnswer.deleteModalTitle')}</Modal.Title>
        <Modal.Body>
          {t('pollAnswer.deleteModalBody', { answer: answerToDelete?.answer })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            onClick={() => deleteAnswer()}
          >
            {t('pollAnswer.deleteBtn')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setModalOpen(false)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
