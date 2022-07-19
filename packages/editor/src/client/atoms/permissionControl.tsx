import React, {ComponentType, PropsWithChildren} from 'react'
import {AuthContext} from '../authContext'

interface PermissionControlProps {
  requiredPermission: string
}

export function PermissionControl({
  children,
  requiredPermission
}: PropsWithChildren<PermissionControlProps>) {
  return (
    <AuthContext.Consumer>
      {value => (
        <>
          {value.session?.roles?.some(role =>
            role.permissions.some(permission => permission.id === requiredPermission)
          )
            ? children
            : null}
        </>
      )}
    </AuthContext.Consumer>
  )
}

export const createCheckedPermissionComponent = <P extends Record<string, unknown>>(
  permission: string
) => (ControlledComponent: ComponentType<P>) => (props: P) => {
  return (
    <PermissionControl requiredPermission={permission}>
      <ControlledComponent {...props} />
    </PermissionControl>
  )
}
