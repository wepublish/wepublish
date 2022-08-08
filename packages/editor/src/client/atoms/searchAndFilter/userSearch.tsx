import {Form, Message, SelectPicker, toaster} from 'rsuite'
import React, {useEffect, useState} from 'react'
import {FullUserFragment, useUserListQuery} from '../../api'

export interface UserSearchProps {
  user?: FullUserFragment | null
  placeholder?: string
  resetFilterKey?: string
  name: string
  onUpdateUser(user: FullUserFragment | undefined | null): void
}

export function UserSearch({
  user,
  placeholder,
  name,
  resetFilterKey,
  onUpdateUser
}: UserSearchProps) {
  const [userSearch, setUserSearch] = useState<string>('')
  const [users, setUsers] = useState<(FullUserFragment | undefined | null)[]>([])
  const {data: userData, loading, error, refetch} = useUserListQuery({
    variables: {
      first: 100,
      filter: userSearch
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (userData?.users) {
      const userList = [...userData.users.nodes.filter(usr => usr.id !== user?.id)]
      if (user) userList.push(user)
      setUsers(userList)
    }
  }, [userData?.users])

  useEffect(() => {
    if (error) {
      toaster.push(
        <Message type="error" showIcon closable>
          {error.message}
        </Message>
      )
    }
  }, [error])

  function setUser(userId: string) {
    const user = users.find(findUser => findUser?.id === userId)
    onUpdateUser(user)
  }

  /**
   * UI helper to provide a meaningful user labeling.
   * @param user
   */
  function getUserLabel(user: FullUserFragment | null | undefined): string {
    if (!user) return ''
    let userLabel = ''
    if (user.firstName) userLabel += `${user.firstName} `
    if (user.name) userLabel += `${user.name} `
    if (user.preferredName) userLabel += `(${user.preferredName}) `
    if (user.email) userLabel += `| ${user.email} `
    if (user.address?.streetAddress) userLabel += `| ${user.address.streetAddress} `
    if (user.address?.zipCode) userLabel += `| ${user.address.zipCode} `
    if (user.address?.city) userLabel += `| ${user.address.city} `
    return userLabel
  }

  // if one wants to reset a filter, it's not working when setting the value property
  function getResetableSelectPicker() {
    if (resetFilterKey) {
      return (
        <>
          <Form.Group>
            <Form.Control
              key={`user-id-${resetFilterKey}`}
              placeholder={placeholder}
              block
              name={name}
              disabled={loading || !!error}
              data={users.map(usr => ({value: usr?.id, label: getUserLabel(usr)}))}
              cleanable
              accepter={SelectPicker}
              onChange={(userId: any) => setUser(userId)}
              onSearch={(searchString: any) => {
                setUserSearch(searchString)
                refetch()
              }}
            />
          </Form.Group>
        </>
      )
    }
    return (
      <>
        <Form.Group>
          <Form.Control
            key={`user-id-${resetFilterKey}`}
            placeholder={placeholder}
            block
            disabled={loading || !!error}
            data={users.map(usr => ({value: usr?.id, label: getUserLabel(usr)}))}
            cleanable
            name={name}
            onChange={(userId: any) => setUser(userId)}
            onSearch={(searchString: any) => {
              setUserSearch(searchString)
              refetch()
            }}
            value={user?.id}
            accepter={SelectPicker}
          />
        </Form.Group>
      </>
    )
  }

  return getResetableSelectPicker()
}
