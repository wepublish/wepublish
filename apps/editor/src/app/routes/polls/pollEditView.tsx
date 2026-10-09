import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Card, CardContent, CardHeader } from '@mui/material';
import {
  FullPollFragment,
  PollDocument,
  PollExternalVote,
  PollExternalVoteSourceFragment,
  UpdatePollDocument,
} from '@wepublish/editor/api';
import { RichtextJSONDocument } from '@wepublish/richtext';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  InfoTooltip,
  PollAnswers,
  PollExternalVotes,
  RichTextBlock,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker, Form, Schema } from 'rsuite';

const DateLabel = styled(Form.Label)`
  margin-right: 8px;
`;

const PollEditor = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: auto;
  align-items: start;
  gap: 16px;
`;

const DatesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
`;

const DateItem = styled.div``;

function PollEditView() {
  const params = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<FullPollFragment | undefined>(undefined);
  const [close, setClose] = useState<boolean>(false);
  const closePath = '/polls';

  /**
   * Handling toasts
   */
  const onErrorToast = (error: Error) => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };
  const onCompletedToast = () => {
    enqueueSnackbar(t('pollEditView.savedSuccessfully'), {
      variant: 'success',
      autoHideDuration: 3000,
    });
  };

  // get polls

  const {
    data,
    loading: createLoading,
    error: pollError,
  } = useQuery(PollDocument, {
    variables: {
      id: params.id!,
    },
  });

  useEffect(() => {
    if (pollError) {
      onErrorToast(pollError);
    }
  }, [pollError]);

  // updating poll
  const [updatePoll, { loading: updateLoading, data: updateData }] =
    useMutation(UpdatePollDocument, {
      onError: onErrorToast,
      onCompleted: onCompletedToast,
    });
  const { t } = useTranslation();
  const loading = createLoading || updateLoading;

  /**
   * Update poll object after fetching from api
   */
  useEffect(() => {
    if (data?.poll) {
      setPoll(data.poll);
    }
  }, [data]);

  useEffect(() => {
    if (updateData?.updatePoll) {
      setPoll(updateData.updatePoll);
    }
  }, [updateData]);

  /**
   * Form validation model
   */
  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    question: StringType().isRequired(t('pollEditView.questionRequired')),
  });

  /**
   * FUNCTIONS
   */
  async function saveOrUpdate(): Promise<void> {
    if (!poll) {
      return;
    }
    const opensAt = poll.opensAt ? new Date(poll.opensAt).toISOString() : null;
    const closedAt =
      poll.closedAt ? new Date(poll.closedAt).toISOString() : null;
    const externalSources = poll.externalVoteSources?.map(
      (voteSource: PollExternalVoteSourceFragment) => ({
        ...voteSource,
        __typename: undefined,
        voteAmounts: voteSource.voteAmounts?.map(
          (voteAmount: PollExternalVote) => ({
            id: voteAmount.id,
            amount: voteAmount.amount,
          })
        ),
      })
    );

    await updatePoll({
      variables: {
        id: poll.id,
        question: poll.question,
        infoText: poll.infoText,
        opensAt,
        closedAt,
        answers: poll.answers?.map(answer => {
          return {
            id: answer.id,
            answer: answer.answer,
          };
        }),
        externalVoteSources: externalSources || [],
      },
    });

    if (close) {
      navigate(closePath);
    }
  }

  const updateOpensAt = (opensAt: Date | null) => {
    if (!poll) {
      return;
    }

    setPoll({
      ...poll,
      opensAt: opensAt?.toISOString() || new Date().toISOString(),
    });
  };

  const updateClosedAt = (closedAt: Date | null) => {
    if (!poll) {
      return;
    }

    setPoll({
      ...poll,
      closedAt: closedAt?.toISOString() ?? null,
    });
  };

  return (
    <Form
      onSubmit={validationPassed => validationPassed && saveOrUpdate()}
      model={validationModel}
      disabled={loading}
      formValue={{ question: poll?.question }}
    >
      <SingleViewTitle
        loading={loading}
        title={poll?.question || t('pollList.noQuestion')}
        loadingTitle={t('pollEditView.loadingTitle')}
        saveBtnTitle={t('pollEditView.saveTitle')}
        saveAndCloseBtnTitle={t('pollEditView.saveAndCloseTitle')}
        closePath={closePath}
        setCloseFn={setClose}
      />

      <PollEditor>
        <Card
          variant="outlined"
          css={{ gridColumn: '-1/1' }}
        >
          <CardContent>
            <Form.Stack fluid>
              <Form.Group controlId="question">
                <Form.Label>{t('pollEditView.questionPanelHeader')}</Form.Label>

                <Form.Control
                  name="question"
                  placeholder={t('pollEditView.toBeOrNotToBe')}
                  value={poll?.question || ''}
                  onChange={(value: string) => {
                    if (!poll) {
                      return;
                    }
                    setPoll(p => (p ? { ...p, question: value } : undefined));
                  }}
                />
              </Form.Group>

              <DatesWrapper>
                <DateItem>
                  <DateLabel>{t('pollEditView.opensAtLabel')}</DateLabel>

                  <DatePicker
                    value={poll?.opensAt ? new Date(poll.opensAt) : undefined}
                    format="yyyy-MM-dd HH:mm"
                    onSelect={updateOpensAt}
                    onChange={updateOpensAt}
                  />
                </DateItem>

                <DateItem>
                  <DateLabel>
                    {t('pollEditView.closesAtLabel')}{' '}
                    <InfoTooltip text={t('pollEditView.closesAtInfo')} />
                  </DateLabel>

                  <DatePicker
                    value={poll?.closedAt ? new Date(poll.closedAt) : undefined}
                    format="yyyy-MM-dd HH:mm"
                    onSelect={updateClosedAt}
                    onChange={updateClosedAt}
                  />
                </DateItem>
              </DatesWrapper>
            </Form.Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader title={t('pollEditView.answerPanelHeader')} />

          <CardContent>
            <PollAnswers
              poll={poll}
              onPollChange={(poll: FullPollFragment) => {
                setPoll(poll);
              }}
            />
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader
            title={
              <>
                {t('pollEditView.infoText')}{' '}
                <InfoTooltip text={t('pollEditView.infoTextInfo')} />
              </>
            }
          />

          <CardContent>
            <RichTextBlock
              value={poll?.infoText}
              onChange={value => {
                if (poll) {
                  setPoll({
                    ...poll,
                    infoText: value as RichtextJSONDocument,
                  });
                }
              }}
            />
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          css={{ gridColumn: '-1/1' }}
        >
          <CardHeader
            title={
              <>
                {t('pollEditView.pollExternalVotesPanelHeader')}{' '}
                <InfoTooltip text={t('pollEditView.pollExternalVotesInfo')} />
              </>
            }
          />

          <CardContent>
            <PollExternalVotes
              poll={poll}
              onPollChange={(poll: FullPollFragment) => {
                setPoll(poll);
              }}
            />
          </CardContent>
        </Card>
      </PollEditor>
    </Form>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_POLL',
  'CAN_UPDATE_POLL',
])(PollEditView);
export { CheckedPermissionComponent as PollEditView };
