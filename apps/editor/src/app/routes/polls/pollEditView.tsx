import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import {
  FullPoll,
  PollExternalVote,
  PollExternalVoteSource,
  usePollQuery,
  useUpdatePollMutation,
} from '@wepublish/editor/api';
import { RichtextJSONDocument } from '@wepublish/richtext';
import {
  createCheckedPermissionComponent,
  PollAnswers,
  PollExternalVotes,
  RichTextBlock,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker, Form, Message, Panel, Schema, toaster } from 'rsuite';

const DateLabel = styled(Form.Label)`
  margin-right: 8px;
`;

const PollEditor = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: auto;
  align-items: start;
  gap: 12px;
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
  const [poll, setPoll] = useState<FullPoll | undefined>(undefined);
  const [close, setClose] = useState<boolean>(false);
  const closePath = '/polls';

  /**
   * Handling toasts
   */
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
  const onCompletedToast = () => {
    toaster.push(
      <Message
        type="success"
        showIcon
        closable
        duration={3000}
      >
        {t('pollEditView.savedSuccessfully')}
      </Message>
    );
  };

  // get polls

  const { data, loading: createLoading } = usePollQuery({
    variables: {
      id: params.id!,
    },
    onError: onErrorToast,
  });

  // updating poll
  const [updatePoll, { loading: updateLoading, data: updateData }] =
    useUpdatePollMutation({
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
      (voteSource: PollExternalVoteSource) => ({
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
        <Panel
          bordered
          css={{ gridColumn: '-1/1' }}
        >
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
                  onChange={(opensAt: Date | null) => {
                    if (!poll) {
                      return;
                    }

                    setPoll({
                      ...poll,
                      opensAt:
                        opensAt?.toISOString() || new Date().toISOString(),
                    });
                  }}
                />
              </DateItem>

              <DateItem>
                <DateLabel>{t('pollEditView.closesAtLabel')}</DateLabel>

                <DatePicker
                  value={poll?.closedAt ? new Date(poll.closedAt) : undefined}
                  format="yyyy-MM-dd HH:mm"
                  onChange={(closedAt: Date | null) => {
                    if (!poll) {
                      return;
                    }

                    setPoll({
                      ...poll,
                      closedAt: closedAt?.toISOString(),
                    });
                  }}
                />
              </DateItem>
            </DatesWrapper>
          </Form.Stack>
        </Panel>

        <Panel
          header={t('pollEditView.answerPanelHeader')}
          bordered
        >
          <PollAnswers
            poll={poll}
            onPollChange={(poll: FullPoll) => {
              setPoll(poll);
            }}
          />
        </Panel>

        <Panel
          header={t('pollEditView.infoText')}
          bordered
        >
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
        </Panel>

        <Panel
          header={t('pollEditView.pollExternalVotesPanelHeader')}
          bordered
          css={{ gridColumn: '-1/1' }}
        >
          <PollExternalVotes
            poll={poll}
            onPollChange={(poll: FullPoll) => {
              setPoll(poll);
            }}
          />
        </Panel>
      </PollEditor>
    </Form>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_POLL',
  'CAN_UPDATE_POLL',
])(PollEditView);
export { CheckedPermissionComponent as PollEditView };
