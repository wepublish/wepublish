import styled from '@emotion/styled';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  ContentGateNewsletterParamInput,
  LoginStatus,
} from '@wepublish/editor/api';
import {
  AudienceField,
  AudienceOption,
  ContentGateFormValues,
} from '@wepublish/gate/editor';
import {
  FormFields,
  InfoTooltip,
  RichTextBlock,
  RichTextBlockValue,
} from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { z } from 'zod';

export type ContentGateFormData = ContentGateFormValues;

/**
 * Content gates are for logged-out readers (a registration wall) or for
 * readers without a subscription, labelled as the website calls them.
 */
export const CONTENT_GATE_AUDIENCES = {
  [LoginStatus.LoggedOut]: 'ANONYMOUS',
  [LoginStatus.Unsubscribed]: 'NON_SUBSCRIBERS',
} as Record<LoginStatus, string>;

const isPathOrUrl = (value: string) => {
  if (value.startsWith('/')) {
    return true;
  }

  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export const createContentGateSchema = (
  t: TFunction
): z.ZodType<ContentGateFormData> => {
  const count = z.number().min(0, t('contentGate.form.mustNotBeNegative'));

  return z.object({
    name: z.string().min(1, t('errorMessages.required')),
    active: z.boolean(),
    audience: z.nativeEnum(LoginStatus),
    freeArticles: count,
    softGateArticles: count,
    previewBlocks: count,
    meterWindowDays: count.nullish(),
    softDescription: z.custom<RichTextBlockValue['richText']>().nullish(),
    hardDescription: z.custom<RichTextBlockValue['richText']>().nullish(),
    ctaLabel: z.string().nullish(),
    ctaUrl: z
      .string()
      .refine(isPathOrUrl, t('contentGate.form.ctaUrlInvalid'))
      .nullish(),
    newsletterParams: z.array(z.object({ key: z.string(), value: z.string() })),
    newsletterNeverGate: z.boolean(),
    newsletterFreeArticles: count,
  });
};

export const contentGateDefaults: ContentGateFormData = {
  name: '',
  active: false,
  audience: LoginStatus.LoggedOut,
  freeArticles: 3,
  softGateArticles: 2,
  previewBlocks: 3,
  meterWindowDays: 30,
  softDescription: null,
  hardDescription: null,
  ctaLabel: null,
  ctaUrl: null,
  newsletterParams: [{ key: 'utm_medium', value: 'email' }],
  newsletterNeverGate: false,
  newsletterFreeArticles: 0,
};

const ContentGateFormContainer = styled('div')`
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: start;
  gap: 16px;
  grid-template-areas:
    'metering   content'
    'audience   content'
    'exclusions content';
`;

type CountFieldName =
  | 'freeArticles'
  | 'softGateArticles'
  | 'previewBlocks'
  | 'meterWindowDays'
  | 'newsletterFreeArticles';

type CountFieldProps = {
  name: CountFieldName;
  label: string;
  info?: string;
  /** Whether an empty field means "no limit" rather than 0. */
  nullable?: boolean;
  disabled?: boolean;
};

const CountField = ({
  name,
  label,
  info,
  nullable,
  disabled,
}: CountFieldProps) => {
  const { control } = useFormContext<ContentGateFormData>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          onChange={({ target: { value } }) =>
            field.onChange(
              value === '' ?
                nullable ? null
                : 0
              : +value
            )
          }
          label={
            info ?
              <>
                {label} <InfoTooltip text={info} />
              </>
            : label
          }
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

export const ContentGateForm = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<ContentGateFormData>();
  const [freeArticles, softGateArticles, newsletterNeverGate] = useWatch({
    control,
    name: ['freeArticles', 'softGateArticles', 'newsletterNeverGate'],
  });
  const {
    fields: newsletterParams,
    append: addNewsletterParam,
    remove: removeNewsletterParam,
  } = useFieldArray({ control, name: 'newsletterParams' });

  return (
    <ContentGateFormContainer>
      <Card
        variant="outlined"
        style={{ gridArea: 'metering' }}
      >
        <CardContent>
          <FormFields>
            <Typography variant="h3">
              {t('contentGate.form.metering')}
            </Typography>

            <Controller
              control={control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label={t('contentGate.form.name')}
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(_event, checked) => field.onChange(checked)}
                    />
                  }
                  label={
                    <>
                      {t('contentGate.form.active')}{' '}
                      <InfoTooltip text={t('contentGate.form.activeInfo')} />
                    </>
                  }
                />
              )}
            />

            <CountField
              name="freeArticles"
              label={t('contentGate.form.freeArticles')}
            />

            <CountField
              name="softGateArticles"
              label={t('contentGate.form.softGateArticles')}
              info={t('contentGate.form.softGateArticlesInfo')}
            />

            <FormControl>
              <FormLabel>{t('contentGate.form.hardGateFrom')}</FormLabel>
              <Typography>
                <strong data-testid="hard-gate-from">
                  {(freeArticles ?? 0) + (softGateArticles ?? 0) + 1}
                </strong>
              </Typography>
              <FormHelperText>
                {t('contentGate.form.hardGateFromHelp')}
              </FormHelperText>
            </FormControl>

            <CountField
              name="meterWindowDays"
              label={t('contentGate.form.meterWindowDays')}
              info={t('contentGate.form.meterWindowDaysInfo')}
              nullable
            />

            <CountField
              name="previewBlocks"
              label={t('contentGate.form.previewBlocks')}
              info={t('contentGate.form.previewBlocksInfo')}
            />
          </FormFields>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ gridArea: 'audience' }}
      >
        <CardContent>
          <FormFields>
            <Typography variant="h3">
              {t('contentGate.form.audience')}
            </Typography>

            <Controller
              control={control}
              name="audience"
              render={({ field }) => (
                <AudienceField
                  name={field.name}
                  value={field.value}
                  options={Object.entries(CONTENT_GATE_AUDIENCES).map(
                    ([value, key]): AudienceOption => ({
                      value: value as LoginStatus,
                      label: (
                        <>
                          {t(`contentGate.audience.${key}`)}{' '}
                          <InfoTooltip
                            text={t(`contentGate.audience.${key}Info`)}
                          />
                        </>
                      ),
                    })
                  )}
                  onChange={field.onChange}
                />
              )}
            />
          </FormFields>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ gridArea: 'exclusions' }}
      >
        <CardContent>
          <FormFields>
            <Typography variant="h3">
              {t('contentGate.form.exclusions')}
            </Typography>

            <FormControl fullWidth>
              <FormLabel>
                {t('contentGate.form.newsletterParams')}{' '}
                <InfoTooltip
                  text={t('contentGate.form.newsletterParamsInfo')}
                />
              </FormLabel>

              <Stack spacing={1}>
                {newsletterParams.map((param, index) => (
                  <Stack
                    key={param.id}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center' }}
                  >
                    <Controller
                      control={control}
                      name={`newsletterParams.${index}.key`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          placeholder={t('contentGate.form.newsletterParamKey')}
                          size="small"
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
                          placeholder={t(
                            'contentGate.form.newsletterParamValue'
                          )}
                          size="small"
                          fullWidth
                        />
                      )}
                    />

                    <IconButton
                      data-testid={`remove-newsletter-param-${index}`}
                      aria-label={t('delete')}
                      onClick={() => removeNewsletterParam(index)}
                    >
                      <MdDelete />
                    </IconButton>
                  </Stack>
                ))}

                <Box>
                  <Button
                    data-testid="add-newsletter-param"
                    variant="outlined"
                    size="small"
                    startIcon={<MdAdd />}
                    onClick={() =>
                      addNewsletterParam({
                        key: '',
                        value: '',
                      } satisfies ContentGateNewsletterParamInput)
                    }
                  >
                    {t('contentGate.form.addNewsletterParam')}
                  </Button>
                </Box>
              </Stack>
            </FormControl>

            <Controller
              control={control}
              name="newsletterNeverGate"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(_event, checked) => field.onChange(checked)}
                    />
                  }
                  label={t('contentGate.form.newsletterNeverGate')}
                />
              )}
            />

            <CountField
              name="newsletterFreeArticles"
              label={t('contentGate.form.newsletterFreeArticles')}
              info={t('contentGate.form.newsletterFreeArticlesInfo')}
              disabled={newsletterNeverGate}
            />
          </FormFields>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        style={{ gridArea: 'content' }}
      >
        <CardContent>
          <FormFields>
            <Typography variant="h3">
              {t('contentGate.form.content')}
            </Typography>

            <FormControl fullWidth>
              <FormLabel>
                {t('contentGate.form.softDescription')}{' '}
                <InfoTooltip text={t('contentGate.form.softDescriptionInfo')} />
              </FormLabel>
              <Controller
                control={control}
                name="softDescription"
                render={({ field }) => (
                  <RichTextBlock
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel>
                {t('contentGate.form.hardDescription')}{' '}
                <InfoTooltip text={t('contentGate.form.hardDescriptionInfo')} />
              </FormLabel>
              <Controller
                control={control}
                name="hardDescription"
                render={({ field }) => (
                  <RichTextBlock
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormControl>

            <Controller
              control={control}
              name="ctaLabel"
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  onChange={({ target: { value } }) =>
                    field.onChange(value || null)
                  }
                  label={
                    <>
                      {t('contentGate.form.ctaLabel')}{' '}
                      <InfoTooltip text={t('contentGate.form.ctaLabelInfo')} />
                    </>
                  }
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="ctaUrl"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  onChange={({ target: { value } }) =>
                    field.onChange(value || null)
                  }
                  label={
                    <>
                      {t('contentGate.form.ctaUrl')}{' '}
                      <InfoTooltip text={t('contentGate.form.ctaUrlInfo')} />
                    </>
                  }
                  error={Boolean(error)}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />
          </FormFields>
        </CardContent>
      </Card>
    </ContentGateFormContainer>
  );
};
