import { useQuery } from '@apollo/client/react';
import { Autocomplete, TextField } from '@mui/material';
import { UserRoleListDocument } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

export interface TokenRolePickerProps {
  value: string[];
  onChange(roleIDs: string[]): void;
  disabled?: boolean;
}

/** Picks the user roles a token acts with, the same roles users get. */
export function TokenRolePicker({
  value,
  onChange,
  disabled,
}: TokenRolePickerProps) {
  const { t } = useTranslation();
  const { data, loading } = useQuery(UserRoleListDocument, {
    variables: { take: 200 },
  });

  const roles = (data?.userRoles.nodes ?? []).map(role => ({
    id: role.id,
    name: role.name,
  }));

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={roles}
      loading={loading}
      disabled={disabled}
      value={roles.filter(role => value.includes(role.id))}
      getOptionLabel={role => role.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      onChange={(_, selected) => onChange(selected.map(role => role.id))}
      renderInput={params => (
        <TextField
          {...params}
          label={t('tokenList.panels.roles')}
        />
      )}
    />
  );
}
