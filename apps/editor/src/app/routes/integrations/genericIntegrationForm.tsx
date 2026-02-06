import { useMutation } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { DocumentNode } from 'graphql';
import { useMemo } from 'react';
import { Controller, FieldValues, Path, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import {
  Button,
  CheckPicker,
  Checkbox,
  Form,
  Message,
  Panel,
  SelectPicker,
  toaster,
} from 'rsuite';
import { z } from 'zod';
import { getApiClientV2 } from '@wepublish/editor/api-v2';

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
  TSetting extends { id: string; name?: string | null; type?: string },
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
  TSetting extends { id: string; name?: string | null; type?: string },
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
  const client = getApiClientV2();
  const [updateSettings, { loading: updating }] = useMutation(mutation, {
    client,
  });

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
    values: initialValues,
  });

  const onSubmit = async (formData: TFormValues) => {
    try {
      await updateSettings({
        variables: mapFormValuesToVariables(formData, setting),
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
  };

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
        onSubmit={() => handleSubmit(onSubmit)()}
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
