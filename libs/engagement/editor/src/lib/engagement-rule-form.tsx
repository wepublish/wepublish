import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  NewsletterReferralMode,
  PageListDocument,
} from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  FormFields,
  ImageEditPanel,
  ImageSelectPanel,
  InfoTooltip,
  RichTextBlock,
} from '@wepublish/ui/editor';
import { ReactNode, useState } from 'react';
import {
  Controller,
  FieldPath,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdExpandMore } from 'react-icons/md';
import {
  EngagementRuleValues,
  PRIORITY_LEVELS,
  PriorityLevel,
  actionDefaults,
  priorityLevel,
  actionNeedsUrl,
  hardStage,
  isAnnouncement,
  stageDefaults,
} from './engagement-rule-values';
import { summarizeRule, summarizeStages } from './summarize-rule';

// Columns follow the width of the form, not the window: the sidebar takes a
// good part of it.
const FormContainer = styled('div')`
  container-type: inline-size;
`;

const FormColumns = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.spacing(2)};

  @container (min-width: 900px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }
`;

/**
 * Goal, audience and where/when stay together at the top instead of spreading
 * along the stages, and follow the scroll when the window is tall enough.
 */
const RuleSettings = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};

  @container (min-width: 900px) {
    @media (min-height: 800px) {
      position: sticky;
      top: ${({ theme }) => theme.spacing(2)};
      max-height: calc(100vh - ${({ theme }) => theme.spacing(4)});
      overflow-y: auto;
    }
  }
`;

const StageAccordion = styled(Accordion)`
  overflow: initial;

  &::before {
    display: none;
  }
`;

/** Related fields side by side, stacked when there is no room. */
const FieldRow = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;
`;

const ActionGroup = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.spacing(1.5)};
  align-items: start;
  padding: ${({ theme }) => theme.spacing(1.5)};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

const ActionDetails = styled(FieldRow)`
  grid-column: 1 / 3;
`;

const label = (text: string, info?: string): ReactNode =>
  info ?
    <>
      {text} <InfoTooltip text={info} />
    </>
  : text;

type NumberFieldProps = {
  name: FieldPath<EngagementRuleValues>;
  label: ReactNode;
  /** An empty field is null instead of 0. */
  nullable?: boolean;
  disabled?: boolean;
};

const NumberField = ({
  name,
  label: fieldLabel,
  nullable,
  disabled,
}: NumberFieldProps) => {
  const { control } = useFormContext<EngagementRuleValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          name={field.name}
          inputRef={field.ref}
          onBlur={field.onBlur}
          value={(field.value as number | null) ?? ''}
          onChange={({ target: { value } }) =>
            field.onChange(
              value === '' ?
                nullable ? null
                : 0
              : +value
            )
          }
          label={fieldLabel}
          type="number"
          slotProps={{ htmlInput: { min: 0 } }}
          disabled={disabled}
          error={Boolean(error)}
          helperText={error?.message}
          fullWidth
        />
      )}
    />
  );
};

type TextFieldControlProps = {
  name: FieldPath<EngagementRuleValues>;
  label: ReactNode;
  multiline?: boolean;
};

const TextFieldControl = ({
  name,
  label: fieldLabel,
  multiline,
}: TextFieldControlProps) => {
  const { control } = useFormContext<EngagementRuleValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          name={field.name}
          inputRef={field.ref}
          onBlur={field.onBlur}
          value={(field.value as string | null) ?? ''}
          onChange={({ target: { value } }) => field.onChange(value || null)}
          label={fieldLabel}
          multiline={multiline}
          rows={multiline ? 4 : undefined}
          error={Boolean(error)}
          helperText={error?.message}
          fullWidth
        />
      )}
    />
  );
};

const SwitchControl = ({
  name,
  label: fieldLabel,
}: {
  name: FieldPath<EngagementRuleValues>;
  label: ReactNode;
}) => {
  const { control } = useFormContext<EngagementRuleValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(field.value)}
              onChange={(_event, checked) => field.onChange(checked)}
            />
          }
          label={fieldLabel}
        />
      )}
    />
  );
};

const ActionList = ({ stageIndex }: { stageIndex: number }) => {
  const { t } = useTranslation();
  const { control, formState } = useFormContext<EngagementRuleValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `stages.${stageIndex}.actions`,
  });
  const actions = useWatch({ control, name: `stages.${stageIndex}.actions` });
  const actionsError =
    formState.errors.stages?.[stageIndex]?.actions?.root?.message ??
    formState.errors.stages?.[stageIndex]?.actions?.message;

  return (
    <FormControl fullWidth>
      <FormLabel>
        {label(t('engagement.form.actions'), t('engagement.form.actionsInfo'))}
      </FormLabel>

      <Stack
        spacing={1.5}
        sx={{ mt: 1 }}
      >
        {fields.map((action, actionIndex) => (
          <ActionGroup
            key={action.id}
            data-testid="action"
          >
            <Controller
              control={control}
              name={`stages.${stageIndex}.actions.${actionIndex}.type`}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  size="small"
                  label={t('engagement.form.actionType')}
                  fullWidth
                >
                  {Object.values(EngagementActionType).map(type => (
                    <MenuItem
                      key={type}
                      value={type}
                    >
                      {t(`engagement.actionType.${type}`)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              control={control}
              name={`stages.${stageIndex}.actions.${actionIndex}.role`}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  size="small"
                  label={t('engagement.form.actionRole')}
                  fullWidth
                >
                  {Object.values(EngagementActionRole).map(role => (
                    <MenuItem
                      key={role}
                      value={role}
                    >
                      {t(`engagement.actionRole.${role}`)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <IconButton
              aria-label={t('delete')}
              onClick={() => remove(actionIndex)}
            >
              <MdDelete />
            </IconButton>

            <ActionDetails>
              <Controller
                control={control}
                name={`stages.${stageIndex}.actions.${actionIndex}.label`}
                render={({ field }) => (
                  <TextField
                    {...field}
                    size="small"
                    label={t('engagement.form.actionLabel')}
                    placeholder={t('engagement.form.actionLabelDefault')}
                    fullWidth
                  />
                )}
              />

              {actionNeedsUrl(
                actions?.[actionIndex]?.type ?? EngagementActionType.Url
              ) && (
                <Controller
                  control={control}
                  name={`stages.${stageIndex}.actions.${actionIndex}.url`}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      size="small"
                      label={t('engagement.form.actionUrl')}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />
              )}
            </ActionDetails>
          </ActionGroup>
        ))}

        {actionsError && <FormHelperText error>{actionsError}</FormHelperText>}

        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MdAdd />}
            onClick={() =>
              append(
                actionDefaults({
                  role:
                    fields.length ?
                      EngagementActionRole.Other
                    : EngagementActionRole.Primary,
                })
              )
            }
          >
            {t('engagement.form.addAction')}
          </Button>
        </Box>
      </Stack>
    </FormControl>
  );
};

type StageFieldsProps = {
  index: number;
  count: number;
  announcement: boolean;
  summary?: string;
  onRemove?: () => void;
};

const StageFields = ({
  index,
  count,
  announcement,
  summary,
  onRemove,
}: StageFieldsProps) => {
  const { t } = useTranslation();
  const { control, setValue, getValues } =
    useFormContext<EngagementRuleValues>();
  const stage = useWatch({ control, name: `stages.${index}` });
  const { errors, submitCount } = useFormState({
    control,
    name: `stages.${index}`,
  });
  const hasErrors = Boolean(errors.stages?.[index]);
  const [expanded, setExpanded] = useState(true);
  const [seenSubmitCount, setSeenSubmitCount] = useState(submitCount);

  // A collapsed stage would hide why saving failed.
  if (submitCount !== seenSubmitCount) {
    setSeenSubmitCount(submitCount);

    if (hasErrors) {
      setExpanded(true);
    }
  }

  const [chooseImage, setChooseImage] = useState(false);
  const [editImage, setEditImage] = useState(false);
  const isLast = index === count - 1;
  const hard = stage?.enforcement === EngagementEnforcement.Hard;
  const placements = Object.values(EngagementPlacement).filter(
    placement =>
      placement !== EngagementPlacement.Cutoff || (!announcement && isLast)
  );

  const setHard = (makeHard: boolean) => {
    const current = getValues(`stages.${index}`);

    setValue(
      `stages.${index}`,
      makeHard ?
        hardStage({
          ...current,
          placement: EngagementPlacement.Cutoff,
          enforcement: EngagementEnforcement.Hard,
          requirement:
            current.requirement ?? EngagementRequirement.Registration,
          previewBlocks: current.previewBlocks ?? 3,
          dismissible: false,
        })
      : stageDefaults({
          ...current,
          enforcement: EngagementEnforcement.Soft,
          requirement: null,
          previewBlocks: null,
          dismissible: true,
        }),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  return (
    <>
      <StageAccordion
        variant="outlined"
        disableGutters
        expanded={expanded}
        onChange={(_event, isExpanded) => setExpanded(isExpanded)}
        data-testid={`stage-${index}`}
      >
        <AccordionSummary expandIcon={<MdExpandMore />}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              component="span"
              sx={{ display: 'block' }}
              color={hasErrors ? 'error' : undefined}
            >
              {announcement ?
                t('engagement.form.message')
              : t('engagement.form.stage', { number: index + 1 })}
            </Typography>

            {summary && (
              <Typography
                variant="body2"
                component="span"
                color="text.secondary"
                sx={{
                  display: 'block',
                  '&::first-letter': { textTransform: 'uppercase' },
                }}
              >
                {summary}
              </Typography>
            )}
          </Box>
        </AccordionSummary>

        <AccordionDetails>
          <FormFields>
            <FieldRow>
              {!announcement && (
                <NumberField
                  name={`stages.${index}.afterArticles`}
                  label={label(
                    t('engagement.form.afterArticles'),
                    t('engagement.form.afterArticlesInfo')
                  )}
                />
              )}

              <Controller
                control={control}
                name={`stages.${index}.placement`}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    select
                    label={label(
                      t('engagement.form.placement'),
                      t('engagement.form.placementInfo')
                    )}
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  >
                    {placements.map(placement => (
                      <MenuItem
                        key={placement}
                        value={placement}
                      >
                        {t(`engagement.placement.${placement}`)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </FieldRow>

            {!announcement &&
              isLast &&
              stage?.placement === EngagementPlacement.Cutoff && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={hard}
                      onChange={(_event, checked) => setHard(checked)}
                    />
                  }
                  label={label(
                    t('engagement.form.hard'),
                    t('engagement.form.hardInfo')
                  )}
                />
              )}

            {hard && (
              <FieldRow>
                <Controller
                  control={control}
                  name={`stages.${index}.requirement`}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      select
                      label={label(
                        t('engagement.form.requirement'),
                        t('engagement.form.requirementInfo')
                      )}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    >
                      {Object.values(EngagementRequirement).map(requirement => (
                        <MenuItem
                          key={requirement}
                          value={requirement}
                        >
                          {t(`engagement.requirement.${requirement}`)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <NumberField
                  name={`stages.${index}.previewBlocks`}
                  label={label(
                    t('engagement.form.previewBlocks'),
                    t('engagement.form.previewBlocksInfo')
                  )}
                  nullable
                />
              </FieldRow>
            )}

            <TextFieldControl
              name={`stages.${index}.title`}
              label={t('engagement.form.title')}
            />

            <FormControl fullWidth>
              <FormLabel>{t('engagement.form.description')}</FormLabel>
              <Controller
                control={control}
                name={`stages.${index}.description`}
                render={({ field }) => (
                  <RichTextBlock
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormControl>

            {stage?.placement === EngagementPlacement.Banner && (
              <>
                <TextFieldControl
                  name={`stages.${index}.text`}
                  label={t('engagement.form.text')}
                />
                <TextFieldControl
                  name={`stages.${index}.html`}
                  label={label(
                    t('engagement.form.html'),
                    t('engagement.form.htmlInfo')
                  )}
                  multiline
                />
                <TextFieldControl
                  name={`stages.${index}.embedUrl`}
                  label={label(
                    t('engagement.form.embedUrl'),
                    t('engagement.form.embedUrlInfo')
                  )}
                />
              </>
            )}

            <TextFieldControl
              name={`stages.${index}.cta`}
              label={label(
                t('engagement.form.cta'),
                t('engagement.form.ctaInfo')
              )}
            />

            <FormControl fullWidth>
              <FormLabel>{t('engagement.form.image')}</FormLabel>
              <ChooseEditImage
                image={stage?.image}
                disabled={false}
                openChooseModalOpen={() => setChooseImage(true)}
                openEditModalOpen={() => setEditImage(true)}
                removeImage={() => {
                  setValue(`stages.${index}.image`, null, {
                    shouldDirty: true,
                  });
                  setValue(`stages.${index}.imageId`, null, {
                    shouldDirty: true,
                  });
                }}
              />
            </FormControl>

            {!hard && (
              <>
                <SwitchControl
                  name={`stages.${index}.dismissible`}
                  label={label(
                    t('engagement.form.dismissible'),
                    t('engagement.form.dismissibleInfo')
                  )}
                />

                <FieldRow>
                  <NumberField
                    name={`stages.${index}.hideForMinutes`}
                    label={label(
                      t('engagement.form.hideForMinutes'),
                      t('engagement.form.hideForMinutesInfo')
                    )}
                    disabled={!stage?.dismissible}
                  />

                  <NumberField
                    name={`stages.${index}.delaySeconds`}
                    label={t('engagement.form.delaySeconds')}
                  />
                </FieldRow>
              </>
            )}

            <ActionList stageIndex={index} />

            {onRemove && (
              <Box>
                <Button
                  variant="text"
                  color="error"
                  startIcon={<MdDelete />}
                  onClick={onRemove}
                >
                  {t('engagement.form.removeStage')}
                </Button>
              </Box>
            )}
          </FormFields>
        </AccordionDetails>
      </StageAccordion>

      <Drawer
        anchor="right"
        slotProps={{
          paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
        }}
        open={chooseImage}
        onClose={() => setChooseImage(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseImage(false)}
          onSelect={image => {
            setChooseImage(false);
            setValue(`stages.${index}.imageId`, image.id, {
              shouldDirty: true,
            });
            setValue(`stages.${index}.image`, image, { shouldDirty: true });
          }}
        />
      </Drawer>

      {stage?.imageId && (
        <Drawer
          anchor="right"
          slotProps={{
            paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
          }}
          open={editImage}
          onClose={() => setEditImage(false)}
        >
          <ImageEditPanel
            id={stage.imageId}
            onClose={() => setEditImage(false)}
          />
        </Drawer>
      )}
    </>
  );
};

const PriorityField = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<EngagementRuleValues>();

  return (
    <Controller
      control={control}
      name="priority"
      render={({ field }) => (
        <FormControl>
          <FormLabel id="engagement-priority">
            {t('engagement.form.priority')}
          </FormLabel>
          <ToggleButtonGroup
            exclusive
            size="small"
            aria-labelledby="engagement-priority"
            value={priorityLevel(field.value)}
            onChange={(_event, level: PriorityLevel | null) => {
              // Clicking the selected level again would leave none selected.
              if (level) {
                field.onChange(PRIORITY_LEVELS[level]);
              }
            }}
            sx={{ mt: 1 }}
          >
            {(Object.keys(PRIORITY_LEVELS) as PriorityLevel[]).map(level => (
              <ToggleButton
                key={level}
                value={level}
              >
                {t(`engagement.priority.${level}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <FormHelperText>{t('engagement.form.priorityInfo')}</FormHelperText>
        </FormControl>
      )}
    />
  );
};

const ReferralFields = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<EngagementRuleValues>();
  const mode = useWatch({ control, name: 'newsletterReferral' });
  const {
    fields: params,
    append,
    remove,
  } = useFieldArray({ control, name: 'newsletterParams' });

  return (
    <>
      <Controller
        control={control}
        name="newsletterReferral"
        render={({ field }) => (
          <FormControl>
            <FormLabel>
              {label(
                t('engagement.form.newsletterReferral'),
                t('engagement.form.newsletterReferralInfo')
              )}
            </FormLabel>
            <RadioGroup
              {...field}
              onChange={(_event, value) => field.onChange(value)}
            >
              {Object.values(NewsletterReferralMode).map(value => (
                <FormControlLabel
                  key={value}
                  value={value}
                  control={<Radio />}
                  label={t(`engagement.referral.${value}`)}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}
      />

      {mode === NewsletterReferralMode.Limited && (
        <NumberField
          name="newsletterReferralLimit"
          label={t('engagement.form.newsletterReferralLimit')}
        />
      )}

      {mode !== NewsletterReferralMode.None && (
        <FormControl fullWidth>
          <FormLabel>
            {label(
              t('engagement.form.newsletterParams'),
              t('engagement.form.newsletterParamsInfo')
            )}
          </FormLabel>

          <Stack spacing={1}>
            {params.map((param, index) => (
              <Stack
                key={param.id}
                direction="row"
                spacing={1}
              >
                <Controller
                  control={control}
                  name={`newsletterParams.${index}.key`}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      placeholder={t('engagement.form.paramKey')}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`newsletterParams.${index}.value`}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      placeholder={t('engagement.form.paramValue')}
                      fullWidth
                    />
                  )}
                />
                <IconButton
                  aria-label={t('delete')}
                  onClick={() => remove(index)}
                >
                  <MdDelete />
                </IconButton>
              </Stack>
            ))}

            <Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MdAdd />}
                onClick={() => append({ key: '', value: '' })}
              >
                {t('engagement.form.addParam')}
              </Button>
            </Box>
          </Stack>
        </FormControl>
      )}
    </>
  );
};

export const EngagementRuleForm = () => {
  const { t } = useTranslation();
  const { control, setValue, getValues, formState } =
    useFormContext<EngagementRuleValues>();
  const [goal, stages] = useWatch({ control, name: ['goal', 'stages'] });
  const announcement = isAnnouncement({ goal });
  const {
    fields: stageFields,
    append: addStage,
    remove: removeStage,
  } = useFieldArray({ control, name: 'stages' });
  const { data: pageData } = useQuery(PageListDocument, {
    variables: { take: 50 },
  });
  const pages = pageData?.pages.nodes ?? [];
  const stagesError =
    formState.errors.stages?.root?.message ?? formState.errors.stages?.message;
  const stageSummaries = stages ? summarizeStages({ goal, stages }, t) : [];

  const changeGoal = (next: EngagementGoal) => {
    const current = getValues();

    setValue('goal', next, { shouldDirty: true });

    if (next === EngagementGoal.Announcement) {
      // One message from the first article on, without meter or referrals.
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
      setValue('newsletterReferral', NewsletterReferralMode.None, {
        shouldDirty: true,
      });
    } else if (current.meterWindowDays == null) {
      setValue('meterWindowDays', 30, { shouldDirty: true });
    }
  };

  return (
    <FormContainer>
      <FormColumns>
        <RuleSettings data-testid="rule-settings">
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

                <PriorityField />

                {stages?.length > 0 && (
                  <FormHelperText data-testid="rule-summary">
                    {summarizeRule({ goal, stages }, t)}
                  </FormHelperText>
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

                <Controller
                  control={control}
                  name="audience"
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      onChange={(_event, value) => field.onChange(value)}
                    >
                      {Object.values(EngagementAudience).map(value => (
                        <FormControlLabel
                          key={value}
                          value={value}
                          control={<Radio />}
                          label={label(
                            t(`engagement.audience.${value}`),
                            t(`engagement.audience.${value}Info`)
                          )}
                        />
                      ))}
                    </RadioGroup>
                  )}
                />
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

                <SwitchControl
                  name="includePeeredArticles"
                  label={label(
                    t('engagement.form.includePeeredArticles'),
                    t('engagement.form.includePeeredArticlesInfo')
                  )}
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
                  <>
                    <NumberField
                      name="meterWindowDays"
                      label={label(
                        t('engagement.form.meterWindowDays'),
                        t('engagement.form.meterWindowDaysInfo')
                      )}
                      nullable
                    />

                    <ReferralFields />
                  </>
                )}
              </FormFields>
            </CardContent>
          </Card>
        </RuleSettings>

        <Stack spacing={2}>
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
                  const last = stages?.at(-1);

                  addStage(
                    stageDefaults({
                      afterArticles: last ? last.afterArticles + 2 : 0,
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
      </FormColumns>
    </FormContainer>
  );
};
