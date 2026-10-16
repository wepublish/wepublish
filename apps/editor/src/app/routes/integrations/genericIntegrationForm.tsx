import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Autocomplete,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Stack,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import { SettingProvider } from '@wepublish/editor/api';
import { enqueueSnackbar, InfoTooltip, Textarea } from '@wepublish/ui/editor';
import { DocumentNode } from 'graphql';
import {
  ChangeEvent,
  ComponentType,
  ReactNode,
  useMemo,
  useState,
} from 'react';
import { Controller, FieldValues, Path, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const HeaderLogo = styled.img`
  min-height: 16px;
  max-height: 28px;
  max-width: 150px;
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

  renderActions?: (setting: TSetting) => ReactNode;
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
  renderActions,
}: GenericIntegrationFormProps<TSetting, TFormValues>) {
  const { t } = useTranslation();

  const [updateSettings, { loading: updating }] = useMutation(mutation, {});

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

  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
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

  const logo = getLogo?.(setting);

  return (
    <form
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
            <Typography
              variant="h5"
              component={HeaderWrapper}
              sx={{
                marginBottom: 2,
              }}
            >
              {setting.name || setting.type}

              {logo && (
                <HeaderLogo
                  src={logo}
                  alt=""
                />
              )}
            </Typography>

            {resolvedFields.map(({ info, ...field }) => (
              <FormControl
                key={String(field.name)}
                fullWidth
              >
                <FormLabel>
                  {field.type === 'checkbox' ?
                    ' '
                  : <>
                      {field.label}
                      {info && (
                        <>
                          {' '}
                          <InfoTooltip text={info} />
                        </>
                      )}
                    </>
                  }
                </FormLabel>

                <Controller
                  name={field.name}
                  control={control}
                  defaultValue={
                    (setting as Record<typeof field.name, unknown>)[
                      field.name
                    ] as any
                  }
                  render={({
                    field: { value, onChange, ...restField },
                    fieldState,
                  }) => {
                    if (field.type === 'select') {
                      return (
                        <MuiTextField
                          select
                          value={value ?? ''}
                          onChange={onChange}
                          disabled={field.disabled}
                          fullWidth
                          {...restField}
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
                          renderInput={params => <MuiTextField {...params} />}
                        />
                      );
                    }

                    if (field.type === 'checkbox') {
                      return (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!value}
                              onChange={(_event, c) => onChange(c)}
                              disabled={field.disabled}
                              {...restField}
                            />
                          }
                          label={
                            <>
                              {field.label}
                              {info && (
                                <>
                                  {' '}
                                  <InfoTooltip text={info} />
                                </>
                              )}
                            </>
                          }
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
                      />
                    );
                  }}
                />
              </FormControl>
            ))}

            {setting.lastLoadedAt && (
              <Typography
                align="right"
                color="gray"
              >
                <small>
                  {t('integrations.lastLoaded')}:{' '}
                  {formatLastLoaded(setting.lastLoadedAt)}{' '}
                  <InfoTooltip text={t('integrations.lastLoadedInfo')} />
                </small>
              </Typography>
            )}
          </CardContent>

          <CardActions>
            <Button
              variant="contained"
              type="submit"
              disabled={updating}
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

            {renderActions?.(setting)}
          </CardActions>
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
