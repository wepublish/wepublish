import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Stack,
  Switch,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import { getSettings, SettingProvider } from '@wepublish/editor/api';
import { enqueueSnackbar, Textarea } from '@wepublish/ui/editor';
import { DocumentNode } from 'graphql';
import {
  ChangeEvent,
  ComponentType,
  Fragment,
  ReactNode,
  useId,
  useMemo,
  useState,
} from 'react';
import { Controller, FieldValues, Path, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import {
  ProviderOption,
  providerLabel,
  providerLogo,
} from './integrationCatalog';
import {
  IntegrationKey,
  isProviderComplete,
  ProviderSetting,
} from './integrationStatus';
import { IntegrationStatusChip } from './integrationStatusChip';
import { providerGuide } from './providerGuides';
import { SetupGuide } from './setupGuide';

const HeaderWrapper = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const HeaderTitle = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const FieldList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 16px;

  & > * {
    grid-column: span 2;
  }

  @media (min-width: 600px) {
    & > [data-half='true'] {
      grid-column: span 1;
    }
  }
`;

const FormFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid
    ${({ theme }) => theme.vars?.palette.divider ?? 'rgba(0, 0, 0, 0.12)'};
`;

const HeaderLogo = styled.img`
  height: 28px;
  max-width: 96px;
  object-fit: contain;
`;

type TextField = {
  type: 'text';
};

type EmailField = {
  type: 'email';
};

type PasswordField = {
  type: 'password';
};

type NumberField = {
  type: 'number';
};

type TextAreaField = {
  type: 'textarea';
  rows?: number;
};

type CheckboxField = {
  type: 'checkbox';
};

type SelectField = {
  type: 'select';
  options?: { label: string; value: string | number }[];
  searchable?: boolean;
};

type CheckPickerField = {
  type: 'checkPicker';
  options?: { label: string; value: string | number }[];
  searchable?: boolean;
};

export type CustomField<T = any> = {
  type: 'custom';
  render: ComponentType<{
    disabled?: boolean;
    name?: string;
    value: T | null | undefined;
    onChange: (val: T | null | undefined) => void;
  }>;
};

type Fields =
  | TextField
  | EmailField
  | PasswordField
  | NumberField
  | TextAreaField
  | SelectField
  | CheckboxField
  | CheckPickerField
  | CustomField;

export type FieldDefinition<TFormValues> = Fields & {
  name: Path<TFormValues>;
  label: string;
  info?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  /** Heads this field and the ones after it, until the next section. */
  section?: string;
  /** Takes half the width, next to its neighbour, on wider screens. */
  half?: boolean;
};

export interface GenericIntegrationFormProps<
  TSetting extends SettingProvider & { type?: string },
  TFormValues extends FieldValues,
> {
  setting: TSetting;
  schema: z.ZodType<TFormValues>;
  mutation: DocumentNode;
  fields:
    | FieldDefinition<TFormValues>[]
    | ((setting: TSetting) => FieldDefinition<TFormValues>[]);
  getLogo?: (setting: TSetting) => string | undefined;
  /** Queries to refetch after saving, e.g. when saving changes other settings */
  refetchQueries?: DocumentNode[];

  /** Turns on the setup guide and the readiness check for this integration. */
  integrationKey?: IntegrationKey;
  /** Friendly names and logos of the provider types. */
  providers?: ProviderOption[];

  renderActions?: (setting: TSetting) => ReactNode;
  /** Read-only state of the integration, shown between the title and the fields. */
  renderStatus?: (setting: TSetting) => ReactNode;
}

export function SingleGenericIntegrationForm<
  TSetting extends SettingProvider & { type?: string },
  TFormValues extends FieldValues,
>({
  setting,
  schema,
  mutation,
  fields,
  getLogo,
  refetchQueries,
  integrationKey,
  providers = [],
  renderActions,
  renderStatus,
}: GenericIntegrationFormProps<TSetting, TFormValues>) {
  const { t } = useTranslation();

  const [updateSettings, { loading: updating }] = useMutation(mutation, {
    refetchQueries: refetchQueries?.map(query => ({ query })),
  });

  const formatLastLoaded = (date?: Date | string) => {
    if (!date) {
      return null;
    }
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-CH', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(dateObj);
  };

  const resolvedFields = useMemo(
    () => (typeof fields === 'function' ? fields(setting) : fields),
    [fields, setting]
  );

  const defaultValues = useMemo(
    () =>
      Object.fromEntries(
        resolvedFields.map(field => [
          field.name,
          (setting as Record<string, unknown>)[String(field.name)],
        ])
      ),
    [resolvedFields, setting]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: defaultValues as never,
  });

  const [pendingTypeChange, setPendingTypeChange] = useState<z.infer<
    typeof schema
  > | null>(null);

  const save = async (formData: z.infer<typeof schema>) => {
    try {
      await updateSettings({
        variables: {
          ...formData,
          id: setting.id,
        },
      });

      reset(formData);

      enqueueSnackbar(t('integrations.updateSuccess'), { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(t('integrations.updateError'), { variant: 'error' });

      console.error(e);
    }
  };

  const onSubmit = handleSubmit(async formData => {
    const nextType = (formData as { type?: string }).type;

    if (nextType && setting.type && nextType !== setting.type) {
      setPendingTypeChange(formData);
      return;
    }

    await save(formData);
  });

  const logo = getLogo?.(setting) ?? providerLogo(providers, setting.type);
  const typeLabel = providerLabel(providers, setting.type);
  const title = setting.name || typeLabel;
  const complete =
    !integrationKey ||
    isProviderComplete(integrationKey, setting as unknown as ProviderSetting);
  const guide =
    integrationKey &&
    providerGuide(
      integrationKey,
      setting as unknown as ProviderSetting,
      t,
      getSettings().apiURL
    );
  const formId = useId();
  const labelIdFor = (name: string) => `${formId}-${name}-label`;
  const helpIdFor = (name: string) => `${formId}-${name}-help`;

  return (
    <form
      aria-labelledby={`${formId}-title`}
      onSubmit={event => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Stack
        spacing={3}
        sx={{ width: '100%' }}
      >
        <Card
          variant="outlined"
          sx={{
            borderRadius: 1,
          }}
        >
          <CardContent>
            <HeaderWrapper>
              {logo ?
                <HeaderLogo
                  src={logo}
                  alt=""
                />
              : <span />}

              <HeaderTitle>
                <Typography
                  id={`${formId}-title`}
                  variant="h6"
                  component="h2"
                  noWrap
                >
                  {title}
                </Typography>

                {title !== typeLabel && (
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                    noWrap
                  >
                    {typeLabel}
                  </Typography>
                )}
              </HeaderTitle>

              {integrationKey ?
                <IntegrationStatusChip
                  status={
                    complete ?
                      { state: 'ready', providers: [title] }
                    : {
                        state: 'incomplete',
                        providers: [title],
                        incomplete: [title],
                      }
                  }
                />
              : <span />}
            </HeaderWrapper>

            {guide && (
              <Box sx={{ marginBottom: 3 }}>
                <SetupGuide
                  provider={typeLabel}
                  steps={guide}
                  defaultExpanded={!complete}
                />
              </Box>
            )}

            {renderStatus?.(setting)}

            <FieldList>
              {resolvedFields.map(({ info, section, ...field }, index) => (
                <Fragment key={String(field.name)}>
                  {section &&
                    resolvedFields[index - 1]?.section !== section && (
                      <Typography
                        variant="subtitle1"
                        component="h3"
                        sx={{ fontWeight: 600, marginTop: index ? 1 : 0 }}
                      >
                        {section}
                      </Typography>
                    )}
                  <FormControl
                    fullWidth
                    data-half={field.half ? 'true' : undefined}
                  >
                    {field.type !== 'checkbox' && (
                      <FormLabel id={labelIdFor(String(field.name))}>
                        {field.label}
                      </FormLabel>
                    )}

                    <Controller
                      name={field.name}
                      control={control}
                      render={({
                        field: { value, onChange, ...restField },
                        fieldState,
                      }) => {
                        const describedBy =
                          info ? helpIdFor(String(field.name)) : undefined;

                        if (field.type === 'select') {
                          return (
                            <MuiTextField
                              select
                              value={value ?? ''}
                              onChange={onChange}
                              disabled={field.disabled}
                              fullWidth
                              {...restField}
                              slotProps={{
                                select: {
                                  labelId: labelIdFor(String(field.name)),
                                  SelectDisplayProps: {
                                    'aria-describedby': describedBy,
                                  },
                                },
                              }}
                            >
                              {(field.options || []).map(option => (
                                <MenuItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </MenuItem>
                              ))}
                            </MuiTextField>
                          );
                        }

                        if (field.type === 'checkPicker') {
                          return (
                            <Autocomplete
                              multiple
                              disableCloseOnSelect
                              options={(field.options || []).map(
                                option => option.value
                              )}
                              getOptionLabel={value =>
                                (field.options || []).find(
                                  option => option.value === value
                                )?.label ?? String(value)
                              }
                              value={value || []}
                              onChange={(_event, chosen) => onChange(chosen)}
                              disabled={field.disabled}
                              {...restField}
                              renderInput={params => (
                                <MuiTextField
                                  {...params}
                                  slotProps={{
                                    ...params.slotProps,
                                    htmlInput: {
                                      ...params.slotProps.htmlInput,
                                      'aria-labelledby': labelIdFor(
                                        String(field.name)
                                      ),
                                      'aria-describedby': describedBy,
                                    },
                                  }}
                                />
                              )}
                            />
                          );
                        }

                        if (field.type === 'checkbox') {
                          return (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={!!value}
                                  onChange={(_event, c) => onChange(c)}
                                  disabled={field.disabled}
                                  {...restField}
                                  slotProps={{
                                    input: { 'aria-describedby': describedBy },
                                  }}
                                />
                              }
                              label={field.label}
                            />
                          );
                        }

                        if (field.type === 'custom') {
                          return (
                            <field.render
                              value={value}
                              onChange={val => onChange(val)}
                              disabled={field.disabled}
                              {...restField}
                            />
                          );
                        }

                        const Field =
                          field.type === 'textarea' ? Textarea : MuiTextField;

                        return (
                          <Field
                            value={value}
                            onChange={
                              field.type === 'number' ?
                                (event: ChangeEvent<HTMLInputElement>) =>
                                  onChange(
                                    event.target.value === '' ?
                                      null
                                    : Number(event.target.value)
                                  )
                              : onChange
                            }
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            type={field.type}
                            placeholder={field.placeholder}
                            disabled={field.disabled}
                            autoComplete={field.autoComplete}
                            fullWidth
                            {...restField}
                            slotProps={{
                              htmlInput: {
                                'aria-labelledby': labelIdFor(
                                  String(field.name)
                                ),
                                'aria-describedby': describedBy,
                              },
                            }}
                          />
                        );
                      }}
                    />

                    {info && (
                      <FormHelperText
                        id={helpIdFor(String(field.name))}
                        sx={{ marginX: 0, whiteSpace: 'pre-line' }}
                      >
                        {info}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Fragment>
              ))}
            </FieldList>

            {setting.lastLoadedAt && (
              <Typography
                variant="caption"
                component="p"
                title={t('integrations.lastLoadedInfo')}
                sx={{ color: 'text.secondary', marginTop: 3 }}
              >
                {t('integrations.lastLoaded')}:{' '}
                {formatLastLoaded(setting.lastLoadedAt)}
              </Typography>
            )}
          </CardContent>

          <FormFooter>
            {renderActions?.(setting)}

            <Box sx={{ flexGrow: 1 }} />

            {isDirty && (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary' }}
              >
                {t('integrations.form.unsaved')}
              </Typography>
            )}

            <Button
              variant="text"
              disabled={!isDirty || updating}
              onClick={() => reset()}
            >
              {t('integrations.form.discard')}
            </Button>

            <Button
              variant="contained"
              type="submit"
              disabled={!isDirty || updating}
            >
              {updating && (
                <CircularProgress
                  size={14}
                  color="inherit"
                  sx={{ mr: 1 }}
                />
              )}

              {t('save')}
            </Button>
          </FormFooter>
        </Card>
      </Stack>

      <Dialog
        open={!!pendingTypeChange}
        onClose={() => setPendingTypeChange(null)}
      >
        <DialogTitle>{t('integrations.typeChangeTitle')}</DialogTitle>

        <DialogContent>{t('integrations.typeChangeWarning')}</DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setPendingTypeChange(null)}
          >
            {t('integrations.cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={updating}
            onClick={async () => {
              const formData = pendingTypeChange;
              setPendingTypeChange(null);

              if (formData) {
                await save(formData);
              }
            }}
          >
            {t('integrations.typeChangeConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  );
}
