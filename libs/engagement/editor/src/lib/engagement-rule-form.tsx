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
  EngagementRulesDocument,
  MemberPlanListDocument,
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
import { MdAdd, MdDelete, MdExpandLess, MdExpandMore } from 'react-icons/md';
import {
  EngagementRuleValues,
  SHOW_FIRST_PRIORITY,
  actionDefaults,
  engagementRuleToValues,
  showsFirst,
  actionNeedsUrl,
  hardStage,
  isAnnouncement,
  isHard,
  outOfOrderAfter,
  stageDefaults,
} from './engagement-rule-values';
import { EngagementConflictNotice } from './engagement-conflict-notice';
import { RuleColumns, RuleContainer } from './engagement-layout';
import { findConflicts } from './engagement-conflicts';
import { StageSummary } from './stage-summary';
import { summarizeStages } from './summarize-rule';
import { useStickyWhenFits } from './use-sticky-when-fits';

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
  min?: number;
  /** Shown while editing, before the form was submitted. */
  liveError?: string;
};

const NumberField = ({
  name,
  label: fieldLabel,
  nullable,
  disabled,
  min = 0,
  liveError,
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
          slotProps={{ htmlInput: { min } }}
          disabled={disabled}
          error={Boolean(error ?? liveError)}
          helperText={error?.message ?? liveError}
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

/**
 * Rarely needed fields, out of the way until asked for. Open from the start
 * when one of them is in use, and again when saving failed on one.
 */
const MoreOptions = ({
  inUse,
  hasErrors,
  children,
}: {
  inUse: boolean;
  hasErrors: boolean;
  children: ReactNode;
}) => {
  const { t } = useTranslation();
  const { submitCount } = useFormState();
  const [open, setOpen] = useState(inUse);
  const [seenSubmitCount, setSeenSubmitCount] = useState(submitCount);

  if (submitCount !== seenSubmitCount) {
    setSeenSubmitCount(submitCount);

    if (hasErrors) {
      setOpen(true);
    }
  }

  return (
    <>
      <Box>
        <Button
          variant="text"
          size="small"
          aria-expanded={open}
          endIcon={open ? <MdExpandLess /> : <MdExpandMore />}
          onClick={() => setOpen(!open)}
        >
          {t('engagement.form.moreOptions')}
        </Button>
      </Box>

      {open && children}
    </>
  );
};

type StageFieldsProps = {
  index: number;
  count: number;
  announcement: boolean;
  summary?: string;
  /** Why the stage does not fit the others, before saving. */
  orderProblem?: string;
  onRemove?: () => void;
};

const StageFields = ({
  index,
  count,
  announcement,
  summary,
  orderProblem,
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
  const hasErrors = Boolean(errors.stages?.[index] ?? orderProblem);
  const [expanded, setExpanded] = useState(true);
  const [seenSubmitCount, setSeenSubmitCount] = useState(submitCount);

  // A collapsed stage would hide why saving failed.
  if (submitCount !== seenSubmitCount) {
    setSeenSubmitCount(submitCount);

    if (hasErrors) {
      setExpanded(true);
    }
  }

  const stageErrors = errors.stages?.[index];
  const moreOptionsInUse = Boolean(
    stage?.cta ||
    stage?.imageId ||
    stage?.html ||
    stage?.embedUrl ||
    stage?.delaySeconds ||
    (stage && stage.hideForMinutes !== stageDefaults().hideForMinutes)
  );
  const moreOptionsHaveErrors = Boolean(
    stageErrors?.cta ||
    stageErrors?.html ||
    stageErrors?.embedUrl ||
    stageErrors?.delaySeconds ||
    stageErrors?.hideForMinutes
  );

  const [chooseImage, setChooseImage] = useState(false);
  const [editImage, setEditImage] = useState(false);
  const isLast = index === count - 1;
  const hard = stage?.enforcement === EngagementEnforcement.Hard;
  const placements = Object.values(EngagementPlacement).filter(
    placement =>
      placement !== EngagementPlacement.Cutoff ||
      (!announcement && (isLast || stage?.placement === placement))
  );

  const setHard = (makeHard: boolean) => {
    const current = getValues(`stages.${index}`);

    setValue(
      `stages.${index}`,
      makeHard ?
        hardStage({
          ...current,
          requirement:
            current.requirement ??
            (getValues('goal') === EngagementGoal.Newsletter ?
              EngagementRequirement.Newsletter
            : EngagementRequirement.Registration),
          previewBlocks: current.previewBlocks ?? 3,
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

            {(orderProblem ?? summary) && (
              <Typography
                variant="body2"
                component="span"
                color={orderProblem ? 'error' : 'text.secondary'}
                sx={{
                  display: 'block',
                  '&::first-letter': { textTransform: 'uppercase' },
                }}
              >
                {orderProblem ?? summary}
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
                  liveError={orderProblem}
                />
              )}

              <Controller
                control={control}
                name={`stages.${index}.placement`}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    onChange={event => {
                      field.onChange(event);

                      // Only a cutoff restricts the article.
                      if (
                        hard &&
                        event.target.value !== EngagementPlacement.Cutoff
                      ) {
                        setHard(false);
                      }
                    }}
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
              (hard ||
                (isLast &&
                  stage?.placement === EngagementPlacement.Cutoff)) && (
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
              <TextFieldControl
                name={`stages.${index}.text`}
                label={t('engagement.form.text')}
              />
            )}

            {!hard && (
              <SwitchControl
                name={`stages.${index}.dismissible`}
                label={label(
                  t('engagement.form.dismissible'),
                  t('engagement.form.dismissibleInfo')
                )}
              />
            )}

            <ActionList stageIndex={index} />

            <MoreOptions
              inUse={moreOptionsInUse}
              hasErrors={moreOptionsHaveErrors}
            >
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

              <TextFieldControl
                name={`stages.${index}.html`}
                label={label(
                  t('engagement.form.html'),
                  t('engagement.form.htmlInfo')
                )}
                multiline
              />

              {stage?.placement === EngagementPlacement.Banner && (
                <TextFieldControl
                  name={`stages.${index}.embedUrl`}
                  label={label(
                    t('engagement.form.embedUrl'),
                    t('engagement.form.embedUrlInfo')
                  )}
                />
              )}

              {!hard && (
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
              )}
            </MoreOptions>

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

const MemberPlansField = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<EngagementRuleValues>();
  const { data } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });
  const plans = data?.memberPlans.nodes ?? [];

  return (
    <Controller
      control={control}
      name="audienceMemberPlanIds"
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={plans.map(plan => plan.id)}
          getOptionLabel={option =>
            plans.find(plan => plan.id === option)?.name ?? option
          }
          value={field.value ?? []}
          onChange={(_event, ids) => field.onChange(ids ?? [])}
          renderInput={params => (
            <TextField
              {...params}
              label={t('engagement.form.audienceMemberPlans')}
              error={Boolean(error)}
              helperText={error?.message}
            />
          )}
        />
      )}
    />
  );
};

/**
 * Priority stays out of the way until the rule competes with another one for
 * the same spot: then the form says with which, and offers to show it first.
 */
const ShowFirstField = ({ ruleId }: { ruleId?: string }) => {
  const { t } = useTranslation();
  const { control } = useFormContext<EngagementRuleValues>();
  const rule = useWatch({ control }) as EngagementRuleValues;
  const { data } = useQuery(EngagementRulesDocument);
  const rules = data?.engagementRules ?? [];
  const self = rules.find(({ id }) => id === ruleId);
  const conflicts =
    rule.stages ?
      findConflicts(
        { ...rule, id: ruleId, createdAt: self?.createdAt },
        rules.map(other => ({
          ...other,
          stages: engagementRuleToValues(other).stages,
        }))
      )
    : [];

  const undecided = conflicts.some(({ settled }) => !settled);

  // Nothing to choose without conflicts, or when the other rule is already
  // set to show first.
  if (!undecided && !showsFirst(rule.priority ?? 0)) {
    return <EngagementConflictNotice conflicts={conflicts} />;
  }

  const showFirst = (
    <Controller
      control={control}
      name="priority"
      render={({ field }) => (
        <FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={showsFirst(field.value)}
                onChange={(_event, checked) =>
                  field.onChange(checked ? SHOW_FIRST_PRIORITY : 0)
                }
              />
            }
            label={t('engagement.form.showFirst')}
          />
          <FormHelperText sx={{ mx: 0 }}>
            {t('engagement.form.showFirstInfo')}
          </FormHelperText>
        </FormControl>
      )}
    />
  );

  return conflicts.length ?
      <EngagementConflictNotice conflicts={conflicts}>
        <Box sx={{ mt: 1 }}>{showFirst}</Box>
      </EngagementConflictNotice>
    : showFirst;
};

type FieldErrorLeaf = { path: string[]; message: string };

/** The messages in react-hook-form's nested errors, with their paths. */
const flattenErrors = (
  errors: unknown,
  path: string[] = []
): FieldErrorLeaf[] => {
  if (!errors || typeof errors !== 'object') {
    return [];
  }

  const { message } = errors as { message?: unknown };

  if (typeof message === 'string') {
    return [{ path, message }];
  }

  return Object.entries(errors).flatMap(([key, value]) =>
    key === 'ref' ? [] : flattenErrors(value, [...path, key])
  );
};

const PROBLEM_FIELD_LABELS: Record<string, string> = {
  name: 'engagement.form.name',
  meterWindowDays: 'engagement.form.meterWindowDays',
  audienceMemberPlanIds: 'engagement.form.audienceMemberPlans',
};

/**
 * What keeps the rule from being saved, in one place: the fields can be far
 * down the page or in a collapsed stage.
 */
const RuleProblems = ({ announcement }: { announcement: boolean }) => {
  const { t } = useTranslation();
  const { control } = useFormContext<EngagementRuleValues>();
  const { errors, submitCount } = useFormState({ control });
  const problems = flattenErrors(errors);

  if (!submitCount || !problems.length) {
    return null;
  }

  const where = ([field, index]: string[]) =>
    field === 'stages' && index != null && /^\d+$/.test(index) ?
      announcement ? t('engagement.form.message')
      : t('engagement.form.stage', { number: +index + 1 })
    : PROBLEM_FIELD_LABELS[field] && t(PROBLEM_FIELD_LABELS[field]);

  return (
    <Alert
      severity="error"
      data-testid="rule-problems"
      sx={{ mb: 2 }}
    >
      {t('engagement.form.problems')}
      <Box
        component="ul"
        sx={{ m: 0, pl: 2.5 }}
      >
        {problems.map(({ path, message }) => {
          const location = where(path);

          return (
            <li key={path.join('.')}>
              {location ? `${location}: ${message}` : message}
            </li>
          );
        })}
      </Box>
    </Alert>
  );
};

export const EngagementRuleForm = ({ ruleId }: { ruleId?: string }) => {
  const { t } = useTranslation();
  const [settingsRef, settingsSticky] =
    useStickyWhenFits<HTMLDivElement>(STICKY_OFFSET);
  const { control, setValue, getValues, formState } =
    useFormContext<EngagementRuleValues>();
  const [goal, stages, audience, includePeeredArticles] = useWatch({
    control,
    name: ['goal', 'stages', 'audience', 'includePeeredArticles'],
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

                {audience === EngagementAudience.MemberPlans && (
                  <MemberPlansField />
                )}
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
