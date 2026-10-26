import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Autocomplete, TextField, Typography } from '@mui/material';
import { UserListDocument } from '@wepublish/editor/api';
import { CanUpdateOtherOrganizationEvents } from '@wepublish/permissions';
import { useAuthorisation } from '@wepublish/ui/editor';
import { useState } from 'react';
import {
  Controller,
  ControllerRenderProps,
  useFormContext,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EventFormValues, EventOwnerOption } from '../event-form-schema';

type OwnerOption = EventOwnerOption & { email?: string | null };

const Option = styled.li`
  display: grid !important;
  justify-items: start;
`;

export const userDisplayName = ({
  firstName,
  name,
}: {
  firstName?: string | null;
  name: string;
}) => [firstName, name].filter(Boolean).join(' ');

function OwnerPicker({
  field,
  isNew,
}: {
  field: ControllerRenderProps<EventFormValues, 'owner'>;
  isNew: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data } = useQuery(UserListDocument, {
    variables: { filter: { text: search || undefined }, take: 10 },
  });

  const found: OwnerOption[] = (data?.users.nodes ?? []).map(user => ({
    id: user.id,
    name: userDisplayName(user),
    email: user.email,
  }));
  const options =
    field.value && !found.some(({ id }) => id === field.value?.id) ?
      [...found, field.value]
    : found;

  return (
    <Autocomplete<OwnerOption>
      options={options}
      value={field.value}
      onChange={(_event, owner) =>
        field.onChange(owner && { id: owner.id, name: owner.name })
      }
      onInputChange={(_event, input, reason) =>
        setSearch(reason === 'input' ? input : '')
      }
      filterOptions={all => all}
      getOptionLabel={owner => owner.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      renderOption={({ key, ...props }, owner) => (
        <Option
          key={key}
          {...props}
        >
          <span>{owner.name}</span>
          {owner.email && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {owner.email}
            </Typography>
          )}
        </Option>
      )}
      renderInput={params => (
        <TextField
          {...params}
          name={field.name}
          inputRef={field.ref}
          label={t('agenda.form.owner')}
          placeholder={isNew ? t('agenda.form.ownerYou') : undefined}
          helperText={
            isNew ?
              t('agenda.form.ownerPickHelp')
            : t('agenda.form.ownerReassignHelp')
          }
        />
      )}
    />
  );
}

export function EventOwnerField({
  isNew,
  viewerCan,
}: {
  isNew: boolean;
  viewerCan?: { reassignOwner: boolean } | null;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext<EventFormValues>();
  const mayChooseAny =
    useAuthorisation(CanUpdateOtherOrganizationEvents.id) === true;
  const mayPick = isNew ? mayChooseAny : viewerCan?.reassignOwner === true;

  return (
    <Controller
      control={control}
      name="owner"
      render={({ field }) =>
        mayPick ?
          <OwnerPicker
            field={field}
            isNew={isNew}
          />
        : <TextField
            label={t('agenda.form.owner')}
            value={
              isNew ? t('agenda.form.ownerYou')
              : field.value ?
                field.value.name
              : t('agenda.form.ownerNone')
            }
            helperText={
              isNew ? t('agenda.form.ownerYouHelp')
              : viewerCan?.reassignOwner === false ?
                t('agenda.form.ownerLocked')
              : undefined
            }
            slotProps={{ htmlInput: { readOnly: true } }}
          />
      }
    />
  );
}
