import {ApolloError} from '@apollo/client'
import styled from '@emotion/styled'
import {useCallback, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd, MdDelete, MdOutlineSave, MdReplay} from 'react-icons/md'
import {
  Button,
  FlexboxGrid,
  Form,
  IconButton as RIconButton,
  Loader as RLoader,
  Message,
  Modal,
  SelectPicker,
  toaster
} from 'rsuite'

import {
  CommentRatingSystemAnswer,
  FullCommentRatingSystem,
  RatingSystemType,
  useCreateRatingSystemAnswerMutation,
  useDeleteRatingSystemAnswerMutation,
  useRatingSystemLazyQuery,
  useUpdateRatingSystemMutation
} from '../api/index'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {createCheckedPermissionComponent} from '../atoms/permissionControl'

const IconButton = styled(RIconButton)`
  margin-top: 12px;
`

const AnswerGrid = styled(FlexboxGrid)`
  margin-bottom: 12px;
  gap: 12px;
`

const Loader = styled(RLoader)`
  margin: 30px;
`

const P = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
`

const FlexGrid = styled(FlexboxGrid)`
  margin-bottom: 40px;
`

const RatingSystem = styled(FlexboxGrid.Item)`
  text-align: right;
`

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

function CommentRatingEditView() {
  const [ratingSystem, setRatingSystem] = useState<FullCommentRatingSystem | null>(null)
  const [answerToDelete, setAnswerToDelete] = useState<string | null>(null)

  const [t] = useTranslation()

  const [fetchRatingSystem, {loading: isFetching}] = useRatingSystemLazyQuery({
    onError: showErrors,
    onCompleted: data => setRatingSystem(data.ratingSystem)
  })

  const [addAnswer, {loading: isAdding}] = useCreateRatingSystemAnswerMutation({
    onCompleted: ({createRatingSystemAnswer}) => {
      setRatingSystem(old =>
        old
          ? {
              ...old,
              answers: [...old.answers, createRatingSystemAnswer]
            }
          : null
      )
    }
  })

  const [deleteAnswer, {loading: isDeleting}] = useDeleteRatingSystemAnswerMutation({
    onError: showErrors,
    onCompleted: data => {
      setRatingSystem(old =>
        old
          ? {
              ...old,
              answers: old.answers.filter(answer => answer.id !== data.deleteRatingSystemAnswer.id)
            }
          : null
      )
    }
  })

  const [updateAnswer, {loading: isUpdating}] = useUpdateRatingSystemMutation({
    onError: showErrors,
    onCompleted: () =>
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('comments.ratingEdit.updateSuccessful')}
        </Message>
      )
  })

  const updateAnswerLocally = useCallback(
    (answerId: string, answer: string | null | undefined, type: RatingSystemType) => {
      setRatingSystem(old =>
        old
          ? {
              ...old,
              answers: old.answers.map(a => (answerId === a.id ? {...a, answer, type} : a))
            }
          : null
      )
    },
    [setRatingSystem]
  )

  const isLoading = isFetching || isAdding || isDeleting || isUpdating

  useEffect(() => {
    fetchRatingSystem()
  }, [])

  return (
    <>
      <FlexGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('comments.ratingEdit.title')}</h2>
        </FlexboxGrid.Item>

        {ratingSystem && (
          <RatingSystem colspan={8}>
            <RIconButton
              type="button"
              appearance="primary"
              data-testid="save"
              disabled={isLoading}
              icon={<MdOutlineSave />}
              onClick={() =>
                updateAnswer({
                  variables: {
                    ratingSystemId: ratingSystem.id,
                    answers: ratingSystem.answers.map(({id, type, answer}) => ({id, type, answer}))
                  }
                })
              }>
              {isLoading ? (
                <P>
                  <MdReplay /> {t('comments.ratingEdit.loading')}
                </P>
              ) : (
                t('save')
              )}
            </RIconButton>
          </RatingSystem>
        )}
      </FlexGrid>

      <Form>
        {ratingSystem && (
          <RatingAnswers
            answers={ratingSystem.answers}
            onAddAnswer={() => {
              addAnswer({
                variables: {
                  type: RatingSystemType.Star,
                  ratingSystemId: ratingSystem.id
                }
              })
            }}
            onDeleteAnswer={setAnswerToDelete}
            onUpdateAnswer={updateAnswerLocally}
          />
        )}
      </Form>

      {isFetching && (
        <FlexboxGrid justify="center">
          <Loader size="lg" />
        </FlexboxGrid>
      )}

      <Modal
        open={!!answerToDelete}
        backdrop="static"
        size="xs"
        onClose={() => setAnswerToDelete(null)}>
        <Modal.Title>{t('comments.ratingEdit.areYouSure')}</Modal.Title>
        <Modal.Body>
          {t('comments.ratingEdit.areYouSureBody', {
            answer: ratingSystem?.answers.find(answer => answer.id === answerToDelete)?.answer
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
            onClick={() => {
              deleteAnswer({
                variables: {
                  answerId: answerToDelete!
                }
              })
              setAnswerToDelete(null)
            }}>
            {t('comments.ratingEdit.areYouSureConfirmation')}
          </Button>

          <Button appearance="subtle" onClick={() => setAnswerToDelete(null)}>
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

type PollAnswersProps = {
  answers: CommentRatingSystemAnswer[]
  onAddAnswer(): void
  onDeleteAnswer(answerId: string): void
  onUpdateAnswer(answerId: string, name: string | null | undefined, type: RatingSystemType): void
}

export function RatingAnswers({
  answers,
  onDeleteAnswer,
  onAddAnswer,
  onUpdateAnswer
}: PollAnswersProps) {
  const {t} = useTranslation()

  return (
    <>
      {answers?.map(answer => (
        <AnswerGrid key={answer.id}>
          <Form.Control
            name={`answer-${answer.id}`}
            placeholder={t('comments.ratingEdit.placeholder')}
            value={answer.answer || ''}
            onChange={(value: string) => onUpdateAnswer(answer.id, value, answer.type)}
          />

          <SelectPicker
            cleanable={false}
            value={answer.type}
            onChange={(value: RatingSystemType) => onUpdateAnswer(answer.id, answer.answer, value)}
            data={Object.entries(RatingSystemType).map(([label, value]) => ({label, value}))}
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

      <IconButton appearance="ghost" onClick={() => onAddAnswer()}>
        <MdAdd />
        {t('comments.ratingEdit.newAnswer')}
      </IconButton>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_COMMENT_RATING_SYSTEM',
  'CAN_CREATE_COMMENT_RATING_SYSTEM',
  'CAN_UPDATE_COMMENT_RATING_SYSTEM',
  'CAN_DELETE_COMMENT_RATING_SYSTEM'
])(CommentRatingEditView)

export {CheckedPermissionComponent as CommentRatingEditView}
