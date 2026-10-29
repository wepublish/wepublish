import { useQuery } from '@apollo/client/react';
import { Autocomplete, TextField } from '@mui/material';
import { FullUserFragment, UserListDocument } from '@wepublish/editor/api';
import { useMemo, useState } from 'react';

export interface UserCheckPickerProps {
  list: FullUserFragment[];
  onClose?(): void;
  onChange?(users: FullUserFragment[]): void;
}

export function UserCheckPicker({ list, onChange }: UserCheckPickerProps) {
  const [usersFilter, setUsersFilter] = useState('');

  const usersVariables = {
    filter: {
      text: usersFilter || undefined,
    },
    take: 10,
  };

  const { data } = useQuery(UserListDocument, {
    variables: usersVariables,
  });

  const foundUsers = useMemo(() => {
    const found = data?.users?.nodes ?? [];
    const foundIDs = found.map(user => user.id);

    return [...found, ...list.filter(user => !foundIDs.includes(user.id))];
  }, [data?.users?.nodes, list]);

  return (
    <Autocomplete
      multiple
      options={foundUsers}
      value={list}
      getOptionLabel={user => user.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={options => options}
      onInputChange={(_event, searchKeyword) => setUsersFilter(searchKeyword)}
      onChange={(_event, users) => onChange?.(users)}
      sx={{ minWidth: 200 }}
      renderInput={params => <TextField {...params} />}
      fullWidth
    />
  );
}
