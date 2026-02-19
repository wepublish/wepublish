import { FullUserFragment, useUserListQuery } from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { CheckPicker } from 'rsuite';

export interface UserCheckPickerProps {
  readonly list: FullUserFragment[];
  onClose?(): void;
  onChange?(users: FullUserFragment[]): void;
}

export function UserCheckPicker({ list, onChange }: UserCheckPickerProps) {
  const [foundUsers, setFoundUsers] = useState<FullUserFragment[]>([]);
  const [usersFilter, setUsersFilter] = useState('');

  const usersVariables = {
    filter: {
      text: usersFilter || undefined,
    },
    take: 10,
  };

  const { data } = useUserListQuery({
    variables: usersVariables,
  });

  useEffect(() => {
    if (data?.users?.nodes) {
      const userIDs = data.users.nodes.map(user => user.id);
      const selectedUsers = list.filter(user => !userIDs.includes(user.id));
      setFoundUsers([...data.users.nodes, ...selectedUsers]);
    }
  }, [data?.users, list]);

  return (
    <CheckPicker
      cleanable
      value={list.map(user => user.id)}
      data={foundUsers.map(user => ({ value: user.id, label: user.name }))}
      onSearch={searchKeyword => {
        setUsersFilter(searchKeyword);
      }}
      onChange={authorsID => {
        const authors = foundUsers.filter(author =>
          authorsID.includes(author.id)
        );
        onChange?.(authors);
      }}
      onExit={() => {
        setUsersFilter('');
      }}
      block
    />
  );
}
