import styled from '@emotion/styled';
import { FormHelperText, TextField } from '@mui/material';
import { ORGANIZATION_CONTACTS_MAX } from '@wepublish/event/schedule';
import { FieldProps, ListInput } from '@wepublish/ui/editor';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { translateFormError } from '../form-error';
import {
  OrganizationContactForm,
  OrganizationFormValues,
} from './organization-form-schema';

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(6rem, 1fr) minmax(10rem, 2fr) minmax(
      8rem,
      1.5fr
    );
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: start;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

type ContactErrors = Partial<Record<keyof OrganizationContactForm, string>>;

function ContactRow({
  position,
  errors,
  disabled,
  value,
  onChange,
}: FieldProps<OrganizationContactForm> & {
  position: number;
  errors: ContactErrors;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  const field = (name: keyof OrganizationContactForm, type = 'text') => (
    <TextField
      size="small"
      type={type}
      label={t(`agenda.organizations.contacts.${name}Label`)}
      value={value[name]}
      disabled={disabled}
      onChange={event => onChange({ ...value, [name]: event.target.value })}
      error={!!errors[name]}
      helperText={errors[name]}
      slotProps={{
        htmlInput: {
          'aria-label': t(`agenda.organizations.contacts.${name}`, {
            position,
          }),
        },
      }}
    />
  );

  return (
    <Row>
      {field('label')}
      {field('email', 'email')}
      {field('phone', 'tel')}
    </Row>
  );
}

export function OrganizationContactsField({
  disabled,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<OrganizationFormValues>();
  const { errors } = useFormState({ control, name: 'contacts' });

  return (
    <Controller
      control={control}
      name="contacts"
      render={({ field }) => {
        const listError = translateFormError(
          t,
          errors.contacts?.message ?? errors.contacts?.root?.message
        );

        return (
          <div>
            <ListInput<OrganizationContactForm>
              value={field.value}
              onChange={field.onChange}
              defaultValue={{ label: '', email: '', phone: '' }}
              dense
              disabled={disabled}
              maxItems={ORGANIZATION_CONTACTS_MAX}
              addLabel={t('agenda.organizations.contacts.add')}
            >
              {({ value, onChange }) => {
                const index = field.value.findIndex(row => row.value === value);
                const rowErrors = errors.contacts?.[index]?.value;

                return (
                  <ContactRow
                    position={index + 1}
                    disabled={disabled}
                    errors={{
                      label: translateFormError(t, rowErrors?.label?.message),
                      email: translateFormError(t, rowErrors?.email?.message),
                      phone: translateFormError(t, rowErrors?.phone?.message),
                    }}
                    value={value}
                    onChange={onChange}
                  />
                );
              }}
            </ListInput>

            <FormHelperText error={!!listError}>
              {listError ??
                (field.value.length >= ORGANIZATION_CONTACTS_MAX ?
                  t('agenda.organizations.contacts.atMax', {
                    max: ORGANIZATION_CONTACTS_MAX,
                  })
                : t('agenda.organizations.contacts.help', {
                    max: ORGANIZATION_CONTACTS_MAX,
                  }))}
            </FormHelperText>
          </div>
        );
      }}
    />
  );
}
