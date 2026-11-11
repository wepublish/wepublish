import { useQuery } from '@apollo/client/react';
import {
  CreateCrowdfundingGoalInput,
  CrowdfundingGoalType,
  FullCrowdfundingFragment,
  MemberPlanListDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { TFunction } from 'i18next';
import { z } from 'zod';
import { CrowdfundingGoalList } from './crowdfunding-goal-list';
import {
  CrowdfundingProgressBar,
  CurrencyInput,
  DateTimePicker,
  InfoTooltip,
} from '@wepublish/ui/editor';
import styled from '@emotion/styled';
import { useId } from 'react';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

export const createCrowdfundingSchema = (t: TFunction) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(1, t('errorMessages.noNameErrorMessage')),
    additionalRevenue: z.coerce.number().nullish(),
    goalType: z.nativeEnum(CrowdfundingGoalType),
    memberPlans: z.array(z.object({ id: z.string() })),
    countSubscriptionsFrom: z.string().nullish(),
    countSubscriptionsUntil: z.string().nullish(),
    goals: z.array(z.custom<CreateCrowdfundingGoalInput>()),
  });

export type CrowdfundingFormValues = z.infer<
  ReturnType<typeof createCrowdfundingSchema>
>;

interface CrowdfundingFormProps {
  create?: boolean;
}

const CrowdfundingFormWrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }
`;

const FieldWithHelp = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};

  & > :first-child {
    flex: 1;
    min-width: 0;
  }
`;

export const CrowdfundingForm = (props: CrowdfundingFormProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext<CrowdfundingFormValues>();
  const {
    fields: goals,
    append,
    remove,
    update,
  } = useFieldArray({ control, name: 'goals' as never });

  const { data: memberPlanData } = useQuery(MemberPlanListDocument, {
    variables: { take: 50 },
    fetchPolicy: 'no-cache',
  });

  const memberPlans = memberPlanData?.memberPlans?.nodes ?? [];
  const values = useWatch({ control });
  const goalType = values.goalType ?? CrowdfundingGoalType.Subscription;
  const isSubscriptionGoal = goalType === CrowdfundingGoalType.Subscription;
  const fieldId = useId();
  const memberPlansLabelId = `${fieldId}-member-plans`;
  const goalTypeLabelId = `${fieldId}-goal-type`;

  return (
    <CrowdfundingFormWrapper>
      <Card
        variant="outlined"
        style={{ overflow: 'initial' }}
      >
        <CardContent>
          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('crowdfunding.form.name')}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="additionalRevenue"
              render={({ field, fieldState: { error } }) =>
                isSubscriptionGoal ?
                  <FieldWithHelp>
                    <TextField
                      {...field}
                      value={field.value ?? 0}
                      label={t('crowdfunding.form.additionalSubscriptions')}
                      type="number"
                      onChange={event =>
                        field.onChange(+(event.target.value || 0))
                      }
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                    <InfoTooltip
                      text={t('crowdfunding.form.additionalSubscriptionsInfo')}
                    />
                  </FieldWithHelp>
                : <FieldWithHelp>
                    <CurrencyInput
                      name={field.name}
                      label={t('crowdfunding.form.additionalRevenue')}
                      currency={'CHF'}
                      centAmount={field.value ?? 0}
                      onChange={field.onChange}
                    />
                    <InfoTooltip
                      text={t('crowdfunding.form.additionalRevenueInfo')}
                    />
                  </FieldWithHelp>
              }
            />
          </Stack>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ overflow: 'initial' }}
      >
        <CardContent>
          <CrowdfundingProgressBar
            crowdfunding={values as Partial<FullCrowdfundingFragment>}
          />
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ overflow: 'initial' }}
      >
        <CardContent>
          <Typography
            variant="h3"
            component="h2"
          >
            {t('crowdfunding.form.filter')}
          </Typography>

          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            <FormControl fullWidth>
              <FieldWithHelp>
                <FormLabel id={memberPlansLabelId}>
                  {t('crowdfunding.form.memberPlans')}
                </FormLabel>
                <InfoTooltip text={t('crowdfunding.form.memberPlansInfo')} />
              </FieldWithHelp>

              <Controller
                control={control}
                name="memberPlans"
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    disableCloseOnSelect
                    options={memberPlans.map(memberPlan => memberPlan.id!)}
                    getOptionLabel={option =>
                      memberPlans
                        .filter(memberPlan => memberPlan.id! === option)
                        .map(memberPlan => memberPlan.name)[0] ?? option
                    }
                    value={field.value?.map(memberPlan => memberPlan.id) ?? []}
                    onChange={(_event, ids) =>
                      field.onChange((ids ?? []).map(id => ({ id })))
                    }
                    renderInput={params => (
                      <TextField
                        {...params}
                        placeholder={t('crowdfunding.form.selectMemberPlans')}
                        slotProps={{
                          ...params.slotProps,
                          htmlInput: {
                            ...params.slotProps.htmlInput,
                            'aria-labelledby': memberPlansLabelId,
                          },
                        }}
                      />
                    )}
                  />
                )}
              />
            </FormControl>

            <Box>
              <Controller
                control={control}
                name="countSubscriptionsFrom"
                render={({ field, fieldState: { error } }) => (
                  <DateTimePicker
                    label={t('crowdfunding.form.countSubscriptionsFrom')}
                    dateTime={field.value ? new Date(field.value) : undefined}
                    changeDate={(date: Date) =>
                      field.onChange(date?.toISOString() || null)
                    }
                    helperText={error?.message}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                control={control}
                name="countSubscriptionsUntil"
                render={({ field, fieldState: { error } }) => (
                  <DateTimePicker
                    label={t('crowdfunding.form.countSubscriptionsUntil')}
                    dateTime={field.value ? new Date(field.value) : undefined}
                    changeDate={(date: Date) =>
                      field.onChange(date?.toISOString() || null)
                    }
                    helperText={error?.message}
                  />
                )}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ overflow: 'initial' }}
      >
        <CardContent>
          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            <Box>
              <FieldWithHelp>
                <Typography
                  variant="h3"
                  component="h2"
                >
                  {t('crowdfunding.form.goals')}
                </Typography>
                <InfoTooltip text={t('crowdfunding.form.goalsInfo')} />
              </FieldWithHelp>

              <FormControl fullWidth>
                <FieldWithHelp>
                  <FormLabel id={goalTypeLabelId}>
                    {t('crowdfunding.form.goalType')}
                  </FormLabel>
                  <InfoTooltip text={t('crowdfunding.form.goalTypeInfo')} />
                </FieldWithHelp>

                <Controller
                  control={control}
                  name="goalType"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      select
                      slotProps={{ select: { labelId: goalTypeLabelId } }}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    >
                      {Object.entries(CrowdfundingGoalType).map(
                        ([label, value]) => (
                          <MenuItem
                            key={value}
                            value={value}
                          >
                            {t(`crowdfunding.form.goalType_${label}`)}
                          </MenuItem>
                        )
                      )}
                    </TextField>
                  )}
                />
              </FormControl>

              <Box sx={{ marginTop: 3 }}>
                <CrowdfundingGoalList
                  goalType={goalType}
                  goals={goals as unknown as CreateCrowdfundingGoalInput[]}
                  onAdd={append}
                  onRemove={remove}
                  onUpdate={update}
                />
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </CrowdfundingFormWrapper>
  );
};
