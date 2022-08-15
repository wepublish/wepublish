import React, {ComponentType, PropsWithChildren, useContext, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {AuthContext} from '../authContext'
import {Message} from 'rsuite'

interface RejectionMessageProps {
  requiredPermissions: string[]
}

export function RejectionMessage({requiredPermissions}: RejectionMessageProps) {
  const {t} = useTranslation()
  return (
    <>
      <Message type="error" header={t('permissions.noAccess')} showIcon>
        {t('permissions.contactAdmin', {permissions: requiredPermissions})}
      </Message>
    </>
  )
}

interface PermissionControlProps {
  qualifyingPermissions: string[]
  showRejectionMessage?: boolean
}

export function PermissionControl({
  children,
  qualifyingPermissions,
  showRejectionMessage
}: PropsWithChildren<PermissionControlProps>) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const roles = useContext(AuthContext)?.session?.roles

  useEffect(() => {
    setIsAuthorized(
      qualifyingPermissions?.some(qualifyingPermission =>
        roles?.some(role =>
          role.permissions.some(userPermission => userPermission.id === qualifyingPermission)
        )
      )
    )
  }, [qualifyingPermissions, roles])

  return (
    <>
      {isAuthorized ? (
        children
      ) : showRejectionMessage ? (
        <RejectionMessage requiredPermissions={qualifyingPermissions} />
      ) : null}
    </>
  )
}

export const createCheckedPermissionComponent = (
  permissions: string[],
  showRejectionMessage?: boolean
) => <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object
>(
  ControlledComponent: ComponentType<P>
) => (props: P) => {
  return (
    <PermissionControl
      qualifyingPermissions={permissions}
      showRejectionMessage={showRejectionMessage ?? true}>
      <ControlledComponent {...props} />
    </PermissionControl>
  )
}

export function authorise(permissionID: string) {
  return useContext(AuthContext)?.session?.roles?.some(role =>
    role.permissions.some(permission => permission.id === permissionID)
  )
}
