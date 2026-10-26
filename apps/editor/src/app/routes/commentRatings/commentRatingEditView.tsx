import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
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
  CanCreateCommentRatingSystem,
  CanDeleteCommentRatingSystem,
  CanGetCommentRatingSystem,
  CanUpdateCommentRatingSystem,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  TableWrapper,
  useSeededState,
} from '@wepublish/ui/editor';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdOutlineSave, MdReplay } from 'react-icons/md';

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
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
  background-color: ${({ theme }) => theme.vars.palette.background.paper};

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
  const newAnswerButton = useRef<HTMLButtonElement>(null);

  const [t] = useTranslation();

  const { loading: isFetching, data } = useQuery(RatingSystemDocument);

  useSeededState(data?.ratingSystem, setRatingSystem);

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

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('comments.ratingEdit.title')}</PageTitle>
          <InfoTooltip text={t('comments.ratingEdit.info')} />
        </ListViewHeader>

        {ratingSystem && (
          <ListViewActions>
            <Button
              ref={newAnswerButton}
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
              startIcon={isLoading ? <MdReplay /> : <MdOutlineSave />}
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
              {isLoading ? t('comments.ratingEdit.loading') : t('save')}
            </Button>
          </ListViewActions>
        )}
      </ListViewContainer>

      <TableWrapper>
        {ratingSystem && (
          <RatingAnswers
            answers={ratingSystem.answers}
            onDeleteAnswer={setAnswerToDelete}
            onUpdateAnswer={updateAnswerLocally}
            emptyFocusRef={newAnswerButton}
          />
        )}
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
            variant="text"
            onClick={() => setAnswerToDelete(null)}
          >
            {t('cancel')}
          </Button>

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
  emptyFocusRef?: RefObject<HTMLElement | null>;
};

export function RatingAnswers({
  answers,
  onDeleteAnswer,
  onUpdateAnswer,
  emptyFocusRef,
}: PollAnswersProps) {
  const { t } = useTranslation();
  const answerInputs = useRef(new Map<string, HTMLInputElement | null>());
  const previousAnswers = useRef(answers);

  useEffect(() => {
    const previous = previousAnswers.current;
    previousAnswers.current = answers;

    const ids = new Set(answers.map(answer => answer.id));
    const removedIndex = previous.findIndex(answer => !ids.has(answer.id));

    if (removedIndex === -1) {
      return;
    }

    const neighbour = previous
      .slice(removedIndex + 1)
      .concat(previous.slice(0, removedIndex).reverse())
      .find(answer => ids.has(answer.id));

    (
      (neighbour && answerInputs.current.get(neighbour.id)) ??
      emptyFocusRef?.current
    )?.focus();
  }, [answers, emptyFocusRef]);

  return (
    <AnswerList>
      {answers?.map(answer => (
        <AnswerRow key={answer.id}>
          <TextField
            inputRef={(element: HTMLInputElement | null) => {
              answerInputs.current.set(answer.id, element);
            }}
            label={t('comments.ratingEdit.placeholder')}
            value={answer.answer || ''}
            onChange={event =>
              onUpdateAnswer(answer.id, event.target.value, answer.type)
            }
            fullWidth
          />

          <TextField
            select
            label={t('comments.ratingEdit.type')}
            value={answer.type}
            onChange={event =>
              onUpdateAnswer(
                answer.id,
                answer.answer,
                event.target.value as RatingSystemType
              )
            }
            fullWidth
          >
            {Object.entries(RatingSystemType).map(([label, value]) => (
              <MenuItem
                key={value}
                value={value}
              >
                {label}
              </MenuItem>
            ))}
          </TextField>

          <IconButtonTooltip caption={t('delete')}>
            <IconButton
              aria-label={`${t('delete')} ${answer.answer || ''}`.trim()}
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
  CanGetCommentRatingSystem.id,
  CanCreateCommentRatingSystem.id,
  CanUpdateCommentRatingSystem.id,
  CanDeleteCommentRatingSystem.id,
])(CommentRatingEditView);

export { CheckedPermissionComponent as CommentRatingEditView };
