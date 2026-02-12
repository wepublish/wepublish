import {
  FullUserFragment,
  getApiClientV2,
  useUserListQuery,
} from '@wepublish/editor/api-v2';
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Message, SelectPicker, toaster } from 'rsuite';

export interface UserSearchProps {
  user?: FullUserFragment | null;
  placeholder?: string;
  resetFilterKey?: string;
  name: string;
  onUpdateUser(user: FullUserFragment | undefined | null): void;
}

export function UserSearch({
  user,
  placeholder,
  name,
  resetFilterKey,
  onUpdateUser,
}: UserSearchProps) {
  const [userSearch, setUserSearch] = useState<string>('');
  const [users, setUsers] = useState<(FullUserFragment | undefined | null)[]>(
    []
  );
  const client = getApiClientV2();
  const {
    data: userData,
    loading,
    error,
    refetch,
  } = useUserListQuery({
    client,
    variables: {
      take: 100,
      filter: {
        text: userSearch,
      },
    },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (userData?.users) {
      const userList = [
        ...userData.users.nodes.filter(usr => usr.id !== user?.id),
      ];

      if (user) {
        userList.push(user);
      }

      setUsers(userList);
    }
  }, [userData?.users, user]);

  useEffect(() => {
    if (error) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {error.message}
        </Message>
      );
    }
  }, [error]);

  function setUser(userId: string) {
    const user = users.find(findUser => findUser?.id === userId);
    onUpdateUser(user);
  }

  /**
   * UI helper to provide a meaningful user labeling.
   * @param user
   */
  function getUserLabel(user: FullUserFragment | null | undefined): string {
    if (!user) return '';
    let userLabel = '';
    if (user.firstName) userLabel += `${user.firstName} `;
    if (user.name) userLabel += `${user.name} `;
    if (user.email) userLabel += `| ${user.email} `;
    if (user.address?.streetAddress)
      userLabel += `| ${user.address.streetAddress} ${user.address.streetAddressNumber ?? ''}`;
    if (user.address?.zipCode) userLabel += `| ${user.address.zipCode} `;
    if (user.address?.city) userLabel += `| ${user.address.city} `;
    return userLabel;
  }

  const formData = useMemo(() => {
    return users.map(usr => ({ value: usr?.id, label: getUserLabel(usr) }));
  }, [users]);

  // if one wants to reset a filter, it's not working when setting the value property
  function getResetableSelectPicker() {
    if (resetFilterKey) {
      return (
        <Form.Group>
          <Form.Control
            key={`user-id-${resetFilterKey}`}
            placeholder={placeholder}
            block
            name={name}
            disabled={loading || !!error}
            data={formData}
            cleanable
            accepter={SelectPicker}
            onChange={(userId: any) => setUser(userId)}
            onSearch={(searchString: any) => {
              setUserSearch(searchString);
              refetch();
            }}
          />
        </Form.Group>
      );
    }
    return (
      <Form.Group>
        <Form.Control
          key={`user-id-${resetFilterKey}`}
          placeholder={placeholder}
          block
          disabled={loading || !!error}
          data={formData}
          cleanable
          name={name}
          onChange={(userId: any) => setUser(userId)}
          onSearch={(searchString: any) => {
            setUserSearch(searchString);
            refetch();
          }}
          value={user?.id}
          accepter={SelectPicker}
        />
      </Form.Group>
    );
  }

  return getResetableSelectPicker();
}
