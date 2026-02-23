import { useMutation } from '@apollo/client';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Typography,
} from '@mui/material';
import { SettingProvider } from '@wepublish/editor/api';
import { Textarea } from '@wepublish/ui/editor';
import { DocumentNode } from 'graphql';
import { useMemo } from 'react';
import { Controller, FieldValues, Path, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Checkbox,
  CheckPicker,
  Form,
  Message,
  SelectPicker,
  toaster,
} from 'rsuite';
import { z } from 'zod';

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const HeaderLogo = styled.img`
  min-height: 16px;
  max-height: 28px;
  max-width: 150px;
`;

export type FieldDefinition<TFormValues> = {
  name: Path<TFormValues>;
  label: string;
  type?:
    | 'text'
    | 'number'
    | 'password'
    | 'textarea'
    | 'select'
    | 'checkPicker'
    | 'checkbox';
  placeholder?: string;
  disabled?: boolean;
  options?: { label: string; value: string | number }[];
  textareaRows?: number;
  autoComplete?: string;
  searchable?: boolean;
};

export interface GenericIntegrationFormProps<
  TSetting extends SettingProvider & { type?: string },
  TFormValues extends FieldValues,
> {
  setting: TSetting;
  schema: z.ZodType<TFormValues>;
  mutation: DocumentNode;
  mapSettingToInitialValues: (setting: TSetting) => TFormValues;
  mapFormValuesToVariables: (
    formData: TFormValues,
    setting: TSetting
  ) => Record<string, any>;
  fields:
    | FieldDefinition<TFormValues>[]
    | ((setting: TSetting) => FieldDefinition<TFormValues>[]);
  getLogo?: (setting: TSetting) => string | undefined;
}

export function SingleGenericIntegrationForm<
  TSetting extends SettingProvider & { type?: string },
  TFormValues extends FieldValues,
>({
  setting,
  schema,
  mutation,
  mapSettingToInitialValues,
  mapFormValuesToVariables,
  fields,
  getLogo,
}: GenericIntegrationFormProps<TSetting, TFormValues>) {
  const { t } = useTranslation();

  const [updateSettings, { loading: updating }] = useMutation(mutation, {});

  const formatLastLoaded = (date?: Date | string) => {
    if (!date) return null;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-CH', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(dateObj);
  };

  const initialValues = useMemo(
    () => mapSettingToInitialValues(setting),
    [setting, mapSettingToInitialValues]
  );

  const resolvedFields = useMemo(
    () => (typeof fields === 'function' ? fields(setting) : fields),
    [fields, setting]
  );

  const { control, handleSubmit } = useForm<TFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(async (formData: TFormValues) => {
    try {
      await updateSettings({
        variables: {
          ...mapFormValuesToVariables(formData, setting),
          id: setting.id,
        },
      });

      toaster.push(
        <Message type="success">{t('integrations.updateSuccess')}</Message>
      );
    } catch (e) {
      toaster.push(
        <Message type="error">{t('integrations.updateError')}</Message>
      );

      console.error(e);
    }
  });

  const logo = getLogo?.(setting);

  return (
    <Form
      fluid
      onSubmit={() => onSubmit()}
    >
      <Card
        variant="outlined"
        sx={{ alignSelf: 'start' }}
      >
        <CardContent>
          <Typography
            variant="h5"
            component={HeaderWrapper}
            marginBottom={2}
          >
            {setting.name || setting.type}

            {logo && (
              <HeaderLogo
                src={logo}
                alt=""
              />
            )}
          </Typography>

          {resolvedFields.map(field => (
            <Form.Group
              controlId={`${String(field.name)}-${setting.id}`}
              key={String(field.name)}
            >
              <Form.ControlLabel>
                {field.type === 'checkbox' ? ' ' : field.label}
              </Form.ControlLabel>

              <Controller
                name={field.name}
                control={control}
                defaultValue={initialValues[field.name]}
                render={({
                  field: { value, onChange, ...restField },
                  fieldState,
                }) => {
                  if (field.type === 'select') {
                    return (
                      <SelectPicker
                        data={field.options || []}
                        value={value}
                        onChange={onChange}
                        disabled={field.disabled}
                        cleanable={false}
                        searchable={field.searchable ?? false}
                        {...restField}
                      />
                    );
                  }

                  if (field.type === 'checkPicker') {
                    return (
                      <CheckPicker
                        data={field.options || []}
                        value={value || []}
                        onChange={val => onChange(val)}
                        disabled={field.disabled}
                        cleanable={false}
                        searchable={field.searchable ?? false}
                        {...restField}
                      />
                    );
                  }

                  if (field.type === 'checkbox') {
                    return (
                      <Checkbox
                        checked={!!value}
                        onChange={(_, c) => onChange(c)}
                        disabled={field.disabled}
                        {...restField}
                      >
                        {field.label}
                      </Checkbox>
                    );
                  }

                  return (
                    <Form.Control
                      value={value}
                      onChange={onChange}
                      errorMessage={fieldState.error?.message}
                      type={
                        field.type === 'password' ? 'password'
                        : field.type === 'number' ?
                          'number'
                        : 'text'
                      }
                      accepter={
                        field.type === 'textarea' ? Textarea : undefined
                      }
                      rows={field.textareaRows}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      disabled={field.disabled}
                      {...restField}
                    />
                  );
                }}
              />
            </Form.Group>
          ))}

          {setting.lastLoadedAt && (
            <Typography
              align="right"
              color="gray"
            >
              <small>
                {t('integrations.lastLoaded')}:{' '}
                {formatLastLoaded(setting.lastLoadedAt)}
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
        </CardActions>
      </Card>
    </Form>
  );
}
