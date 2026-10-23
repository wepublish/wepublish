import styled from '@emotion/styled';
import { FormLabel, TextField } from '@mui/material';
import { FieldProps, ListInput } from '@wepublish/ui/editor';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues } from '../event-form-schema';
import { translateFormError } from '../form-error';

export type EventRateForm = EventFormValues['rates'][number]['value'];

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(7rem, 1fr) minmax(9rem, 2fr);
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: start;
`;

function RateRow({
  position,
  priceError,
  value,
  onChange,
}: FieldProps<EventRateForm> & { position: number; priceError?: string }) {
  const { t } = useTranslation();

  return (
    <Row>
      <TextField
        size="small"
        label={t('agenda.rates.priceLabel')}
        placeholder={t('agenda.rates.pricePlaceholder')}
        value={value.price}
        onChange={event => onChange({ ...value, price: event.target.value })}
        error={!!priceError}
        helperText={priceError}
        slotProps={{
          htmlInput: { 'aria-label': t('agenda.rates.price', { position }) },
        }}
      />
      <TextField
        size="small"
        label={t('agenda.rates.designationLabel')}
        placeholder={t('agenda.rates.designationPlaceholder')}
        value={value.designation}
        onChange={event =>
          onChange({ ...value, designation: event.target.value })
        }
        slotProps={{
          htmlInput: {
            'aria-label': t('agenda.rates.designation', { position }),
          },
        }}
      />
    </Row>
  );
}

export function EventRatesField() {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();
  const { errors } = useFormState({ control, name: 'rates' });

  return (
    <Controller
      control={control}
      name="rates"
      render={({ field }) => (
        <div>
          <FormLabel component="div">{t('agenda.rates.title')}</FormLabel>
          <ListInput<EventRateForm>
            value={field.value}
            onChange={field.onChange}
            defaultValue={{ price: '', designation: '' }}
            dense
            addLabel={t('agenda.rates.add')}
          >
            {({ value, onChange }) => {
              const index = field.value.findIndex(row => row.value === value);

              return (
                <RateRow
                  position={index + 1}
                  priceError={translateFormError(
                    t,
                    errors.rates?.[index]?.value?.price?.message
                  )}
                  value={value}
                  onChange={onChange}
                />
              );
            }}
          </ListInput>
        </div>
      )}
    />
  );
}
