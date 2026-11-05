import { useQuery } from '@apollo/client/react';
import { Autocomplete, Box, TextField } from '@mui/material';
import { FullUserFragment, UserListDocument } from '@wepublish/editor/api';
import { ReactNode, useMemo, useState } from 'react';

export interface UserSearchProps {
  user?: FullUserFragment | null;
  placeholder?: string;
  name: string;
  disableClearable?: boolean;
  onUpdateUser(user: FullUserFragment | undefined | null): void;
  label?: ReactNode;
  'aria-labelledby'?: string;
}

/**
 * UI helper to provide a meaningful user labeling.
 * @param user
 */
function getUserLabel(user: FullUserFragment | null | undefined): string {
  if (!user) {
    return '';
  }
  let userLabel = '';
  if (user.firstName) {
    userLabel += `${user.firstName} `;
  }
  if (user.name) {
    userLabel += `${user.name} `;
  }
  if (user.email) {
    userLabel += `| ${user.email} `;
  }
  if (user.address?.streetAddress) {
    userLabel += `| ${user.address.streetAddress} ${user.address.streetAddressNumber ?? ''}`;
  }
  if (user.address?.zipCode) {
    userLabel += `| ${user.address.zipCode} `;
  }
  if (user.address?.city) {
    userLabel += `| ${user.address.city} `;
  }
  return userLabel;
}

export function UserSearch({
  user,
  placeholder,
  name,
  disableClearable,
  onUpdateUser,
  label,
  'aria-labelledby': ariaLabelledby,
}: UserSearchProps) {
  const [userSearch, setUserSearch] = useState<string>('');
  const [open, setOpen] = useState(false);

  const {
    data: userData,
    loading,
    error,
  } = useQuery(UserListDocument, {
    variables: {
      take: 100,
      filter: {
        text: userSearch,
      },
    },
    skip: !open,
  });

  const users = useMemo(() => {
    const found = (userData?.users?.nodes ?? []).filter(
      usr => usr.id !== user?.id
    );

    return user ? [...found, user] : found;
  }, [userData?.users?.nodes, user]);

  function setUser(userId: string | null) {
    const user = users.find(findUser => findUser?.id === userId);
    onUpdateUser(user);
  }

  const formData = useMemo(() => {
    return users.map(usr => ({ value: usr?.id, label: getUserLabel(usr) }));
  }, [users]);

  const selected = useMemo(
    () => (user ? { value: user.id, label: getUserLabel(user) } : null),
    [user]
  );

  return (
    <Box sx={{ marginBottom: 3 }}>
      <Autocomplete
        disableClearable={disableClearable}
        options={formData}
        filterOptions={options => options}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => {
          setOpen(false);
          setUserSearch('');
        }}
        loading={loading}
        onInputChange={(_event, value, reason) => {
          if (reason === 'input') {
            setUserSearch(value);
          }
        }}
        getOptionLabel={option => option.label}
        isOptionEqualToValue={(option, selected) =>
          option.value === selected.value
        }
        value={selected}
        onChange={(_event, option) => {
          const userId = option?.value ?? null;
          setUser(userId);
        }}
        disabled={!!error}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.slotProps.htmlInput,
                'aria-labelledby': ariaLabelledby,
              },
            }}
            placeholder={placeholder}
          />
        )}
      />
    </Box>
  );
}
