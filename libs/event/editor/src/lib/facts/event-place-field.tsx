import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Autocomplete, TextField, Typography } from '@mui/material';
import { TinyPlaceListDocument } from '@wepublish/editor/api';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues, EventPlaceOption } from '../event-form-schema';

const Option = styled.li`
  display: grid !important;
  justify-items: start;
`;

const locationOf = ({ zip, city }: EventPlaceOption) =>
  [zip, city].filter(Boolean).join(' ');

export function EventPlaceField() {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();
  const [search, setSearch] = useState('');

  const { data, loading } = useQuery(TinyPlaceListDocument, {
    variables: {
      filter: { selectable: true, ...(search ? { search } : {}) },
      take: 20,
    },
  });

  const nodes: EventPlaceOption[] = data?.places.nodes ?? [];
  const noneSelectable = !search && !!data && data.places.totalCount === 0;

  return (
    <Controller
      control={control}
      name="place"
      render={({ field }) => (
        <Autocomplete<EventPlaceOption>
          options={
            field.value && !nodes.some(({ id }) => id === field.value?.id) ?
              [...nodes, field.value]
            : nodes
          }
          loading={loading}
          value={field.value}
          onChange={(_event, place) => field.onChange(place)}
          onInputChange={(_event, input, reason) =>
            setSearch(reason === 'input' ? input : '')
          }
          filterOptions={options => options}
          getOptionLabel={place => place.name}
          isOptionEqualToValue={(option, selected) => option.id === selected.id}
          renderOption={({ key, ...props }, place) => (
            <Option
              key={key}
              {...props}
            >
              <span>{place.name}</span>
              {locationOf(place) && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {locationOf(place)}
                </Typography>
              )}
            </Option>
          )}
          renderInput={params => (
            <TextField
              {...params}
              name={field.name}
              inputRef={field.ref}
              label={t('agenda.form.place')}
              helperText={
                noneSelectable ?
                  t('agenda.form.placeNone')
                : t('agenda.form.placeHelp')
              }
            />
          )}
        />
      )}
    />
  );
}
