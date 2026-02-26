import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  CommentRatingSystemAnswer,
  FullCommentRatingSystemFragment,
  RatingSystemType,
  useCreateRatingSystemAnswerMutation,
  useDeleteRatingSystemAnswerMutation,
  useRatingSystemLazyQuery,
  useUpdateRatingSystemMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdOutlineSave, MdReplay } from 'react-icons/md';
import {
  Button,
  FlexboxGrid,
  Form,
  IconButton as RIconButton,
  Loader as RLoader,
  Message,
  Modal,
  SelectPicker,
  toaster,
} from 'rsuite';

const Content = styled.div`
  margin-top: 2rem;
  height: 100%;
`;

const IconButton = styled(RIconButton)`
  margin-right: 12px;
`;

const AnswerGrid = styled(FlexboxGrid)`
  margin-bottom: 12px;
  gap: 12px;
`;

const Loader = styled(RLoader)`
  margin: 30px;
`;

const P = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const showErrors = (error: ApolloError): void => {
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

function CommentRatingEditView() {
  const [ratingSystem, setRatingSystem] =
    useState<FullCommentRatingSystemFragment | null>(null);
  const [answerToDelete, setAnswerToDelete] = useState<string | null>(null);

  const [t] = useTranslation();

  const [fetchRatingSystem, { loading: isFetching }] = useRatingSystemLazyQuery(
    {
      onError: showErrors,
      onCompleted: data => setRatingSystem(data.ratingSystem),
    }
  );

  const [addAnswer, { loading: isAdding }] =
    useCreateRatingSystemAnswerMutation({
      onCompleted: ({ createRatingSystemAnswer }) => {
        setRatingSystem(old =>
          old ?
            {
              ...old,
              answers: [...old.answers, createRatingSystemAnswer],
            }
          : null
        );
      },
    });

  const [deleteAnswer, { loading: isDeleting }] =
    useDeleteRatingSystemAnswerMutation({
      onError: showErrors,
      onCompleted: data => {
        setRatingSystem(old =>
          old ?
            {
              ...old,
              answers: old.answers.filter(
                answer => answer.id !== data.deleteRatingSystemAnswer.id
              ),
            }
          : null
        );
      },
    });

  const [updateAnswer, { loading: isUpdating }] = useUpdateRatingSystemMutation(
    {
      onError: showErrors,
      onCompleted: () =>
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={3000}
          >
            {t('comments.ratingEdit.updateSuccessful')}
          </Message>
        ),
    }
  );

  const updateAnswerLocally = useCallback(
    (
      answerId: string,
      answer: string | null | undefined,
      type: RatingSystemType
    ) => {
      setRatingSystem(old =>
        old ?
          {
            ...old,
            answers: old.answers.map(a =>
              answerId === a.id ? { ...a, answer, type } : a
            ),
          }
        : null
      );
    },
    [setRatingSystem]
  );

  const isLoading = isFetching || isAdding || isDeleting || isUpdating;

  useEffect(() => {
    fetchRatingSystem();
  }, []);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('comments.ratingEdit.title')}</h2>
        </ListViewHeader>

        {ratingSystem && (
          <ListViewActions>
            <IconButton
              appearance="primary"
              onClick={() => {
                addAnswer({
                  variables: {
                    type: RatingSystemType.Star,
                    ratingSystemId: ratingSystem.id,
                  },
                });
              }}
            >
              <MdAdd />
              {t('comments.ratingEdit.newAnswer')}
            </IconButton>

            <RIconButton
              type="button"
              appearance="primary"
              data-testid="save"
              disabled={isLoading}
              icon={<MdOutlineSave />}
              onClick={() =>
                updateAnswer({
                  variables: {
                    id: ratingSystem.id,
                    answers: ratingSystem.answers.map(
                      ({ id, type, answer }) => ({ id, type, answer })
                    ),
                  },
                })
              }
            >
              {isLoading ?
                <P>
                  <MdReplay /> {t('comments.ratingEdit.loading')}
                </P>
              : t('save')}
            </RIconButton>
          </ListViewActions>
        )}
      </ListViewContainer>

      <TableWrapper>
        <Content>
          <Form>
            {ratingSystem && (
              <RatingAnswers
                answers={ratingSystem.answers}
                onDeleteAnswer={setAnswerToDelete}
                onUpdateAnswer={updateAnswerLocally}
              />
            )}
          </Form>
        </Content>
      </TableWrapper>

      {isFetching && (
        <FlexboxGrid justify="center">
          <Loader size="lg" />
        </FlexboxGrid>
      )}

      <Modal
        open={!!answerToDelete}
        backdrop="static"
        size="xs"
        onClose={() => setAnswerToDelete(null)}
      >
        <Modal.Title>{t('comments.ratingEdit.areYouSure')}</Modal.Title>
        <Modal.Body>
          {t('comments.ratingEdit.areYouSureBody', {
            answer: ratingSystem?.answers.find(
              answer => answer.id === answerToDelete
            )?.answer,
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
            onClick={() => {
              deleteAnswer({
                variables: {
                  answerId: answerToDelete!,
                },
              });
              setAnswerToDelete(null);
            }}
          >
            {t('comments.ratingEdit.areYouSureConfirmation')}
          </Button>

          <Button
            appearance="subtle"
            onClick={() => setAnswerToDelete(null)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

type PollAnswersProps = {
  answers: CommentRatingSystemAnswer[];
  onDeleteAnswer(answerId: string): void;
  onUpdateAnswer(
    answerId: string,
    name: string | null | undefined,
    type: RatingSystemType
  ): void;
};

export function RatingAnswers({
  answers,
  onDeleteAnswer,
  onUpdateAnswer,
}: PollAnswersProps) {
  const { t } = useTranslation();

  return (
    <div>
      {answers?.map(answer => (
        <AnswerGrid key={answer.id}>
          <Form.Control
            name={`answer-${answer.id}`}
            placeholder={t('comments.ratingEdit.placeholder')}
            value={answer.answer || ''}
            onChange={(value: string) =>
              onUpdateAnswer(answer.id, value, answer.type)
            }
          />

          <SelectPicker
            cleanable={false}
            value={answer.type}
            onChange={(value: RatingSystemType | null) =>
              onUpdateAnswer(answer.id, answer.answer, value!)
            }
            data={Object.entries(RatingSystemType).map(([label, value]) => ({
              label,
              value,
            }))}
          />

          <IconButtonTooltip caption={t('delete')}>
            <RIconButton
              icon={<MdDelete />}
              circle
              size="sm"
              appearance="ghost"
              color="red"
              onClick={() => onDeleteAnswer(answer.id)}
            />
          </IconButtonTooltip>
        </AnswerGrid>
      ))}
    </div>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_COMMENT_RATING_SYSTEM',
  'CAN_CREATE_COMMENT_RATING_SYSTEM',
  'CAN_UPDATE_COMMENT_RATING_SYSTEM',
  'CAN_DELETE_COMMENT_RATING_SYSTEM',
])(CommentRatingEditView);

export { CheckedPermissionComponent as CommentRatingEditView };
