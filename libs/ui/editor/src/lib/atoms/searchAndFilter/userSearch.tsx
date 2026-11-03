import { useQuery } from '@apollo/client/react';
import {
  Autocomplete,
  AutocompleteRenderInputParams,
  Box,
  TextField,
} from '@mui/material';
import { FullUserFragment, UserListDocument } from '@wepublish/editor/api';
import { ReactNode, useMemo, useState } from 'react';

export type UserSearchValue = Pick<FullUserFragment, 'id' | 'name'> &
  Partial<Pick<FullUserFragment, 'firstName' | 'email' | 'address'>>;

export interface UserSearchProps<T extends UserSearchValue = FullUserFragment> {
  user?: T | null;
  placeholder?: string;
  name: string;
  disableClearable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  onUpdateUser(user: T | FullUserFragment | undefined | null): void;
  label?: ReactNode;
  'aria-labelledby'?: string;
  renderInput?: (params: AutocompleteRenderInputParams) => ReactNode;
}

function getUserLabel(user: UserSearchValue | null | undefined): string {
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

export function UserSearch<T extends UserSearchValue = FullUserFragment>({
  user,
  placeholder,
  name,
  disableClearable,
  disabled,
  readOnly,
  id,
  onUpdateUser,
  label,
  'aria-labelledby': ariaLabelledby,
  renderInput,
}: UserSearchProps<T>) {
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
    const found: (T | FullUserFragment)[] = (
      userData?.users?.nodes ?? []
    ).filter(usr => usr.id !== user?.id);

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
    <Box sx={renderInput ? undefined : { marginBottom: 3 }}>
      <Autocomplete
        id={id}
        readOnly={readOnly}
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
        disabled={disabled || !!error}
        renderInput={
          renderInput ??
          (params => (
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
          ))
        }
      />
    </Box>
  );
}
