import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  EngagementActionRole,
  EngagementActionType,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  BlockTemplateListDocument,
} from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  FormFields,
  ImageEditPanel,
  ImageSelectPanel,
  RichTextBlock,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdExpandMore } from 'react-icons/md';
import {
  EngagementRuleValues,
  actionDefaults,
  actionTakesUrl,
  hardStage,
  stageDefaults,
} from './engagement-rule-values';
import {
  FieldRow,
  label,
  MoreOptions,
  NumberField,
  SwitchControl,
  TextFieldControl,
} from './rule-form-controls';

const StageAccordion = styled(Accordion)`
  overflow: initial;

  &::before {
    display: none;
  }
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

const ActionList = ({ stageIndex }: { stageIndex: number }) => {
  const { t } = useTranslation();
  const { control, formState } = useFormContext<EngagementRuleValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `stages.${stageIndex}.actions`,
  });
  const actions = useWatch({ control, name: `stages.${stageIndex}.actions` });
  const placement = useWatch({
    control,
    name: `stages.${stageIndex}.placement`,
  });
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

              {actionTakesUrl(actions?.[actionIndex] ?? actionDefaults()) && (
                <Controller
                  control={control}
                  name={`stages.${stageIndex}.actions.${actionIndex}.url`}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      size="small"
                      label={t('engagement.form.actionUrl')}
                      error={Boolean(error)}
                      helperText={
                        error?.message ??
                        ((
                          actions?.[actionIndex]?.type ===
                            EngagementActionType.Newsletter &&
                          placement !== EngagementPlacement.Banner
                        ) ?
                          t('engagement.form.newsletterUrlInfo')
                        : undefined)
                      }
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

const BlockTemplateField = ({
  name,
}: {
  name: `stages.${number}.blockTemplateId`;
}) => {
  const { t } = useTranslation();
  const { control } = useFormContext<EngagementRuleValues>();
  const { data } = useQuery(BlockTemplateListDocument, {
    variables: { take: 100 },
    fetchPolicy: 'cache-and-network',
  });
  const templates = data?.blockTemplates.nodes ?? [];

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <>
          <FormControlLabel
            control={
              <Switch
                checked={!!field.value}
                disabled={!field.value && !templates.length}
                onChange={(_event, checked) =>
                  field.onChange((checked && templates[0]?.id) || null)
                }
              />
            }
            label={label(
              t('engagement.form.useBlockTemplate'),
              templates.length || field.value ?
                t('engagement.form.useBlockTemplateInfo')
              : t('engagement.form.noBlockTemplates')
            )}
          />

          {!!field.value && (
            <TextField
              select
              label={t('engagement.form.blockTemplate')}
              value={templates.length ? field.value : ''}
              onChange={event => field.onChange(event.target.value)}
              fullWidth
            >
              {templates.map(({ id, name: templateName }) => (
                <MenuItem
                  key={id}
                  value={id}
                >
                  {templateName}
                </MenuItem>
              ))}
            </TextField>
          )}
        </>
      )}
    />
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

export const StageFields = ({
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
  // A block template replaces the texts, the title and buttons stay.
  const fromTemplate = !!stage?.blockTemplateId;
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
          enforcement: EngagementEnforcement.Hard,
          dismissible: false,
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

            <BlockTemplateField name={`stages.${index}.blockTemplateId`} />

            {!fromTemplate && (
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
            )}

            {!fromTemplate &&
              stage?.placement === EngagementPlacement.Banner && (
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
              {!fromTemplate && (
                <TextFieldControl
                  name={`stages.${index}.cta`}
                  label={label(
                    t('engagement.form.cta'),
                    t('engagement.form.ctaInfo')
                  )}
                />
              )}

              {!fromTemplate && (
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
              )}

              {!fromTemplate && (
                <TextFieldControl
                  name={`stages.${index}.html`}
                  label={label(
                    t('engagement.form.html'),
                    t('engagement.form.htmlInfo')
                  )}
                  multiline
                />
              )}

              {!fromTemplate &&
                stage?.placement === EngagementPlacement.Banner && (
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
