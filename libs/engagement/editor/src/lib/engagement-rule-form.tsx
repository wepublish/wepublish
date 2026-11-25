import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  PageListDocument,
} from '@wepublish/editor/api';
import { FormFields } from '@wepublish/ui/editor';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import {
  EngagementRuleValues,
  actionDefaults,
  isAnnouncement,
  isHard,
  usesNewsletterSignup,
  outOfOrderAfter,
  stageDefaults,
} from './engagement-rule-values';
import { RuleColumns, RuleContainer } from './engagement-layout';
import { StageSummary } from './stage-summary';
import { summarizeStages } from './summarize-rule';
import { useStickyWhenFits } from './use-sticky-when-fits';
import {
  label,
  MoreOptions,
  NumberField,
  SwitchControl,
  TextFieldControl,
} from './rule-form-controls';
import {
  AudienceFields,
  NewsletterSignupWarning,
  RuleProblems,
  ShowFirstField,
} from './rule-settings-fields';
import { StageFields } from './stage-fields';

const STICKY_OFFSET = 16;

/**
 * Goal, audience and where/when stay together at the top instead of spreading
 * along the stages, and follow the scroll while they fit the editor's page
 * (`useStickyWhenFits`). No scrollbar of their own: it cut the cards off and
 * only scrolled once the page was at its end.
 */
const RuleSettings = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};

  @container (min-width: 900px) {
    &[data-sticky='true'] {
      position: sticky;
      top: ${STICKY_OFFSET}px;
    }
  }
`;

export const EngagementRuleForm = ({ ruleId }: { ruleId?: string }) => {
  const { t } = useTranslation();
  const [settingsRef, settingsSticky] =
    useStickyWhenFits<HTMLDivElement>(STICKY_OFFSET);
  const { control, setValue, getValues, formState } =
    useFormContext<EngagementRuleValues>();
  const [goal, stages, includePeeredArticles] = useWatch({
    control,
    name: ['goal', 'stages', 'includePeeredArticles'],
  });
  const announcement = isAnnouncement({ goal });
  const {
    fields: stageFields,
    insert: insertStage,
    remove: removeStage,
  } = useFieldArray({ control, name: 'stages' });
  const { data: pageData } = useQuery(PageListDocument, {
    variables: { take: 50 },
  });
  const pages = pageData?.pages.nodes ?? [];
  const stagesError =
    formState.errors.stages?.root?.message ?? formState.errors.stages?.message;
  const stageSummaries = stages ? summarizeStages({ goal, stages }, t) : [];
  const orderProblems = (stages ?? []).map((_stage, index) => {
    const previous = outOfOrderAfter(stages, index);

    return previous ?
        t('engagement.validation.ascending', {
          step: index,
          count: previous.afterArticles,
        })
      : undefined;
  });

  const changeGoal = (next: EngagementGoal) => {
    const current = getValues();

    setValue('goal', next, { shouldDirty: true });

    // Membership prompts are for readers who are no members yet.
    if (
      (next === EngagementGoal.Membership) !==
        (current.goal === EngagementGoal.Membership) &&
      !current.audiences.includes(EngagementAudience.Members)
    ) {
      setValue(
        'excludedAudiences',
        Object.values(EngagementAudience).filter(audience =>
          audience === EngagementAudience.Members ?
            next === EngagementGoal.Membership
          : current.excludedAudiences.includes(audience)
        ),
        { shouldDirty: true }
      );
    }

    if (next === EngagementGoal.Announcement) {
      // One message from the first article on, without a meter.
      const [first] = current.stages;

      setValue(
        'stages',
        [
          stageDefaults({
            ...(first ?? {}),
            afterArticles: 0,
            placement:
              first && first.placement !== EngagementPlacement.Cutoff ?
                first.placement
              : EngagementPlacement.Banner,
            enforcement: EngagementEnforcement.Soft,
            requirement: null,
            previewBlocks: null,
            dismissible: true,
          }),
        ],
        { shouldDirty: true }
      );
      setValue('meterWindowDays', null, { shouldDirty: true });
    } else if (current.meterWindowDays == null) {
      setValue('meterWindowDays', 30, { shouldDirty: true });
    }
  };

  return (
    <RuleContainer>
      <RuleProblems announcement={announcement} />

      <RuleColumns>
        <RuleSettings
          ref={settingsRef}
          data-sticky={settingsSticky}
          data-testid="rule-settings"
        >
          <Card variant="outlined">
            <CardContent>
              <FormFields>
                <Typography variant="h3">
                  {t('engagement.form.goal')}
                </Typography>

                <TextFieldControl
                  name="name"
                  label={t('engagement.form.name')}
                />

                <SwitchControl
                  name="active"
                  label={t('engagement.form.active')}
                />

                <FormControl>
                  <RadioGroup
                    value={goal}
                    onChange={(_event, value) =>
                      changeGoal(value as EngagementGoal)
                    }
                  >
                    {Object.values(EngagementGoal).map(value => (
                      <FormControlLabel
                        key={value}
                        value={value}
                        control={<Radio />}
                        label={label(
                          t(`engagement.goal.${value}`),
                          t(`engagement.goal.${value}Info`)
                        )}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                {goal === EngagementGoal.Newsletter && (
                  <Alert
                    severity="info"
                    data-testid="newsletter-note"
                  >
                    {t('engagement.form.newsletterNote')}
                  </Alert>
                )}

                {stages && usesNewsletterSignup(stages) && (
                  <NewsletterSignupWarning />
                )}

                <ShowFirstField ruleId={ruleId} />

                {stages?.length > 0 && (
                  <Typography
                    variant="body2"
                    component="div"
                    color="text.secondary"
                  >
                    <StageSummary
                      rule={{ goal, stages }}
                      testId="rule-summary"
                    />
                  </Typography>
                )}
              </FormFields>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <FormFields>
                <Typography variant="h3">
                  {t('engagement.form.audience')}
                </Typography>

                <AudienceFields />
              </FormFields>
            </CardContent>
          </Card>

          <Card
            variant="outlined"
            style={{ overflow: 'initial' }}
          >
            <CardContent>
              <FormFields>
                <Typography variant="h3">
                  {t('engagement.form.trigger')}
                </Typography>

                <SwitchControl
                  name="showOnArticles"
                  label={t('engagement.form.showOnArticles')}
                />

                <Controller
                  control={control}
                  name="showOnPageIds"
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={pages.map(page => page.id)}
                      getOptionLabel={option =>
                        pages.find(page => page.id === option)?.latest.title ??
                        option
                      }
                      value={field.value ?? []}
                      onChange={(_event, ids) => field.onChange(ids ?? [])}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={t('engagement.form.showOnPages')}
                        />
                      )}
                    />
                  )}
                />

                {!announcement && (
                  <NumberField
                    name="meterWindowDays"
                    min={1}
                    label={label(
                      t('engagement.form.meterWindowDays'),
                      t('engagement.form.meterWindowDaysInfo')
                    )}
                    nullable
                  />
                )}

                <MoreOptions
                  inUse={includePeeredArticles}
                  hasErrors={false}
                >
                  <SwitchControl
                    name="includePeeredArticles"
                    label={label(
                      t('engagement.form.includePeeredArticles'),
                      t('engagement.form.includePeeredArticlesInfo')
                    )}
                  />
                </MoreOptions>
              </FormFields>
            </CardContent>
          </Card>
        </RuleSettings>

        {/* A gap, not margins: an open accordion drops its top margin when it
            is the first of its type, right under the heading. */}
        <Stack
          spacing={2}
          useFlexGap
          data-testid="stages"
        >
          <Typography variant="h3">
            {t('engagement.form.presentation')}
          </Typography>

          {stageFields.map((stage, index) => (
            <StageFields
              key={stage.id}
              index={index}
              count={stageFields.length}
              announcement={announcement}
              summary={stageSummaries[index]}
              orderProblem={announcement ? undefined : orderProblems[index]}
              onRemove={
                !announcement && stageFields.length > 1 ?
                  () => removeStage(index)
                : undefined
              }
            />
          ))}

          {stagesError && <FormHelperText error>{stagesError}</FormHelperText>}

          {!announcement && (
            <Box>
              <Button
                variant="outlined"
                startIcon={<MdAdd />}
                onClick={() => {
                  // A stage that restricts the article stays the last one.
                  const current = stages ?? [];
                  const last = current.at(-1);
                  const at =
                    last && isHard(last) ? current.length - 1 : current.length;
                  const before = current[at - 1];
                  const after = current[at];
                  const afterArticles =
                    !before ? 0
                    : after ?
                      Math.floor(
                        (before.afterArticles + after.afterArticles) / 2
                      )
                    : before.afterArticles + 2;

                  insertStage(
                    at,
                    stageDefaults({
                      afterArticles,
                      actions: [
                        actionDefaults({
                          type:
                            goal === EngagementGoal.Newsletter ?
                              EngagementActionType.Newsletter
                            : EngagementActionType.Membership,
                        }),
                      ],
                    })
                  );
                }}
              >
                {t('engagement.form.addStage')}
              </Button>
            </Box>
          )}
        </Stack>
      </RuleColumns>
    </RuleContainer>
  );
};
