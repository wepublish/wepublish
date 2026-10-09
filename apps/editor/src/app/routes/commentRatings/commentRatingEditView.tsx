import { useLazyQuery, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton as MuiIconButton,
  Stack,
} from '@mui/material';
import {
  CommentRatingSystemAnswer,
  CreateRatingSystemAnswerDocument,
  DeleteRatingSystemAnswerDocument,
  FullCommentRatingSystemFragment,
  RatingSystemDocument,
  RatingSystemType,
  UpdateRatingSystemDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdOutlineSave, MdReplay } from 'react-icons/md';
import { Form, SelectPicker } from 'rsuite';

const Content = styled.div`
  margin-top: 2rem;
  height: 100%;
`;

const IconButton = styled(MuiIconButton)`
  margin-right: 12px;
`;

const AnswerList = styled.div`
  display: grid;
  gap: 12px;
  width: 100%;
  max-width: 880px;
`;

const AnswerRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--rs-border-primary);
  border-radius: var(--rs-radius-md);
  background-color: var(--rs-bg-card);

  && .rs-form-control-wrapper,
  && .rs-picker,
  && .rs-picker-toggle {
    width: 100%;
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr) auto;

    > :first-child {
      grid-column: 1 / -1;
    }
  }
`;

const Loader = styled(CircularProgress)`
  margin: 32px;
`;

const P = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const showErrors = (error: Error): void => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

function CommentRatingEditView() {
  const [ratingSystem, setRatingSystem] =
    useState<FullCommentRatingSystemFragment | null>(null);
  const [answerToDelete, setAnswerToDelete] = useState<string | null>(null);

  const [t] = useTranslation();

  const [fetchRatingSystem, { loading: isFetching, data, error }] =
    useLazyQuery(RatingSystemDocument);

  useEffect(() => {
    if (error) {
      showErrors(error);
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      setRatingSystem(data.ratingSystem);
    }
  }, [data]);

  const [addAnswer, { loading: isAdding }] = useMutation(
    CreateRatingSystemAnswerDocument,
    {
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
    }
  );

  const [deleteAnswer, { loading: isDeleting }] = useMutation(
    DeleteRatingSystemAnswerDocument,
    {
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
    }
  );

  const [updateAnswer, { loading: isUpdating }] = useMutation(
    UpdateRatingSystemDocument,
    {
      onError: showErrors,
      onCompleted: () =>
        enqueueSnackbar(t('comments.ratingEdit.updateSuccessful'), {
          variant: 'success',
          autoHideDuration: 3000,
        }),
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
              answerId === a.id ? { ...a, answer: answer ?? null, type } : a
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
          <InfoTooltip text={t('comments.ratingEdit.info')} />
        </ListViewHeader>

        {ratingSystem && (
          <ListViewActions>
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => {
                addAnswer({
                  variables: {
                    type: RatingSystemType.Star,
                    ratingSystemId: ratingSystem.id,
                  },
                });
              }}
            >
              {t('comments.ratingEdit.newAnswer')}
            </Button>

            <Button
              variant="contained"
              startIcon={<MdOutlineSave />}
              type="button"
              data-testid="save"
              disabled={isLoading}
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
            </Button>
          </ListViewActions>
        )}
      </ListViewContainer>

      <TableWrapper>
        <Content>
          <Form>
            <Form.Stack fluid>
              {ratingSystem && (
                <RatingAnswers
                  answers={ratingSystem.answers}
                  onDeleteAnswer={setAnswerToDelete}
                  onUpdateAnswer={updateAnswerLocally}
                />
              )}
            </Form.Stack>
          </Form>
        </Content>
      </TableWrapper>

      {isFetching && (
        <Stack
          direction="row"
          sx={{ justifyContent: 'center' }}
        >
          <CircularProgress size={40} />
        </Stack>
      )}

      <Dialog
        fullWidth
        open={!!answerToDelete}
        maxWidth="xs"
        onClose={() => setAnswerToDelete(null)}
      >
        <DialogTitle>{t('comments.ratingEdit.areYouSure')}</DialogTitle>
        <DialogContent>
          {t('comments.ratingEdit.areYouSureBody', {
            answer: ratingSystem?.answers.find(
              answer => answer.id === answerToDelete
            )?.answer,
          })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
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
            variant="text"
            onClick={() => setAnswerToDelete(null)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
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
    <AnswerList>
      {answers?.map(answer => (
        <AnswerRow key={answer.id}>
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
            <IconButton
              aria-label={t('delete')}
              size="small"
              color="error"
              onClick={() => onDeleteAnswer(answer.id)}
            >
              <MdDelete />
            </IconButton>
          </IconButtonTooltip>
        </AnswerRow>
      ))}
    </AnswerList>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_COMMENT_RATING_SYSTEM',
  'CAN_CREATE_COMMENT_RATING_SYSTEM',
  'CAN_UPDATE_COMMENT_RATING_SYSTEM',
  'CAN_DELETE_COMMENT_RATING_SYSTEM',
])(CommentRatingEditView);

export { CheckedPermissionComponent as CommentRatingEditView };
