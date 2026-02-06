import { useMutation } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { DocumentNode } from 'graphql';
import { useMemo } from 'react';
import {
  Control,
  Controller,
  FieldValues,
  Path,
  useForm,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Form, Message, Panel, SelectPicker, toaster } from 'rsuite';
import { z } from 'zod';
import { getApiClientV2 } from '@wepublish/editor/api-v2';

export type FieldDefinition<TFormValues> = {
  name: Path<TFormValues>;
  label: string;
  type?: 'text' | 'password' | 'textarea' | 'select';
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
  fields: FieldDefinition<TFormValues>[];
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

  return (
    <Panel
      header={setting.name || setting.type}
      bordered
      style={{ marginBottom: 20 }}
    >
      <Form
        fluid
        onSubmit={() => handleSubmit(onSubmit)()}
        disabled={updating}
      >
        {fields.map(field => (
          <Form.Group
            controlId={`${String(field.name)}-${setting.id}`}
            key={String(field.name)}
          >
            <Form.ControlLabel>{field.label}</Form.ControlLabel>
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

                return (
                  <Form.Control
                    value={value}
                    onChange={onChange}
                    errorMessage={fieldState.error?.message}
                    type={field.type === 'password' ? 'password' : 'text'}
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
          loading={updating}
        >
          {t('save')}
        </Button>
      </Form>
    </Panel>
  );
}
