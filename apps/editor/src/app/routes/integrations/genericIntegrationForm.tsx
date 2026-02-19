import { useMutation } from '@apollo/client';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { DocumentNode } from 'graphql';
import { useMemo } from 'react';
import { Controller, FieldValues, Path, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Checkbox,
  CheckPicker,
  Form,
  Message,
  Panel,
  SelectPicker,
  toaster,
} from 'rsuite';
import { z } from 'zod';

const StyledPanel = styled(Panel)`
  margin-bottom: 20px;
`;

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

const LastLoadedInfo = styled.div`
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 12px;
  text-align: right;
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
};

export interface GenericIntegrationFormProps<
  TSetting extends {
    id: string;
    name?: string | null;
    type?: string;
    lastLoadedAt?: Date | string;
  },
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
  TSetting extends {
    id: string;
    name?: string | null;
    type?: string;
    lastLoadedAt?: Date | string;
  },
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
    return new Intl.DateTimeFormat('default', {
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
    defaultValues: initialValues,
  });

  const onSubmit = handleSubmit(
    async (formData: TFormValues) => {
      console.log('Form submitted with data:', formData);
      try {
        const variables = mapFormValuesToVariables(formData, setting);
        console.log('Mutation variables:', variables);

        await updateSettings({
          variables,
        });

        toaster.push(
          <Message type="success">{t('integrations.updateSuccess')}</Message>
        );
      } catch (e) {
        toaster.push(
          <Message type="error">{t('integrations.updateError')}</Message>
        );

        console.error('Mutation error:', e);
      }
    },
    errors => {
      console.log('Form validation errors:', errors);
    }
  );

  const logo = getLogo?.(setting);

  return (
    <StyledPanel
      header={
        <HeaderWrapper>
          {setting.name || setting.type}
          {logo && (
            <HeaderLogo
              src={logo}
              alt=""
            />
          )}
        </HeaderWrapper>
      }
      bordered
    >
      <Form
        fluid
        onSubmit={(checkStatus, event) => {
          event.preventDefault();
          onSubmit();
        }}
        disabled={updating}
      >
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
                      searchable={false}
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
                      searchable={false}
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
                      field.type === 'textarea' ? 'textarea' : undefined
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
          <LastLoadedInfo>
            {t('integrations.lastLoaded')}:{' '}
            {formatLastLoaded(setting.lastLoadedAt)}
          </LastLoadedInfo>
        )}

        <Button
          appearance="primary"
          type="submit"
          size="lg"
          block
          loading={updating}
        >
          {t('save')}
        </Button>
      </Form>
    </StyledPanel>
  );
}
