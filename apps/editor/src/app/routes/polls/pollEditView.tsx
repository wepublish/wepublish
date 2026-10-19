import { useApolloClient, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  FormLabel,
  Stack,
  TextField,
} from '@mui/material';
import {
  FullPollFragment,
  PollDocument,
  PollExternalVote,
  PollExternalVoteSourceFragment,
  UpdatePollDocument,
} from '@wepublish/editor/api';
import { CanGetPoll, CanUpdatePoll } from '@wepublish/permissions';
import { RichtextJSONDocument } from '@wepublish/richtext';
import {
  createCheckedPermissionComponent,
  DatePicker,
  enqueueSnackbar,
  humanizeError,
  InfoTooltip,
  PollAnswers,
  PollExternalVotes,
  RichTextBlock,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

const DateLabel = styled(FormLabel)`
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

const InfoText = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  align-content: start;
`;

function PollEditView() {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const client = useApolloClient();
  const pollId = params.id!;
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

  const schema = z.object({
    poll: z.custom<FullPollFragment>().superRefine((poll, ctx) => {
      if (!poll?.question) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['question'],
          message: t('errorMessages.noQuestionErrorMessage'),
        });
      }
    }),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isLoading },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      const { data } = await client.query({
        query: PollDocument,
        variables: { id: pollId },
      });

      return { poll: data!.poll! };
    },
  });

  const poll = useWatch({ control, name: 'poll' });

  // updating poll
  const [updatePoll, { loading: updateLoading }] = useMutation(
    UpdatePollDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        setValue('poll', data.updatePoll as FullPollFragment);
        onCompletedToast();
      },
    }
  );
  const loading = isLoading || updateLoading;

  /**
   * FUNCTIONS
   */
  async function saveOrUpdate({ poll }: z.infer<typeof schema>): Promise<void> {
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

  if (isLoading) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(saveOrUpdate)}>
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
            <Stack
              spacing={3}
              sx={{ width: '100%' }}
            >
              <Controller
                control={control}
                name="poll.question"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('pollEditView.questionPanelHeader')}
                    placeholder={t('pollEditView.toBeOrNotToBe')}
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <DatesWrapper>
                <DateItem>
                  <DateLabel>{t('pollEditView.opensAtLabel')}</DateLabel>

                  <Controller
                    control={control}
                    name="poll.opensAt"
                    render={({ field }) => (
                      <DatePicker
                        withTime
                        value={field.value ? new Date(field.value) : null}
                        onChange={opensAt =>
                          field.onChange(
                            opensAt?.toISOString() || new Date().toISOString()
                          )
                        }
                        fullWidth
                      />
                    )}
                  />
                </DateItem>

                <DateItem>
                  <DateLabel>
                    {t('pollEditView.closesAtLabel')}{' '}
                    <InfoTooltip text={t('pollEditView.closesAtInfo')} />
                  </DateLabel>

                  <Controller
                    control={control}
                    name="poll.closedAt"
                    render={({ field }) => (
                      <DatePicker
                        withTime
                        value={field.value ? new Date(field.value) : null}
                        onChange={closedAt =>
                          field.onChange(closedAt?.toISOString() ?? null)
                        }
                        fullWidth
                      />
                    )}
                  />
                </DateItem>
              </DatesWrapper>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={t('pollEditView.answerPanelHeader')} />

          <CardContent>
            <Controller
              control={control}
              name="poll"
              render={({ field }) => (
                <PollAnswers
                  poll={field.value}
                  onPollChange={field.onChange}
                />
              )}
            />
          </CardContent>
        </Card>

        <InfoText>
          <FormLabel>
            {t('pollEditView.infoText')}{' '}
            <InfoTooltip text={t('pollEditView.infoTextInfo')} />
          </FormLabel>

          <Controller
            control={control}
            name="poll.infoText"
            render={({ field }) => (
              <RichTextBlock
                value={field.value}
                onChange={value =>
                  field.onChange(value as RichtextJSONDocument)
                }
              />
            )}
          />
        </InfoText>

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
            <Controller
              control={control}
              name="poll"
              render={({ field }) => (
                <PollExternalVotes
                  poll={field.value}
                  onPollChange={field.onChange}
                />
              )}
            />
          </CardContent>
        </Card>
      </PollEditor>
    </form>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPoll.id,
  CanUpdatePoll.id,
])(PollEditView);
export { CheckedPermissionComponent as PollEditView };
