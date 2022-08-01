import React, {ComponentType, PropsWithChildren} from 'react'
import {AuthContext} from '../authContext'
import {useTranslation} from 'react-i18next'

interface PermissionControlProps {
  requiredPermission: string
  showMessage?: boolean
}

export function PermissionControl({
  children,
  requiredPermission,
  showMessage
}: PropsWithChildren<PermissionControlProps>) {
  const {t} = useTranslation()
  return (
    <AuthContext.Consumer>
      {value => (
        <>
          {value.session?.roles?.some(role =>
            role.permissions.some(permission => permission.id === requiredPermission)
          ) ? (
            children
          ) : showMessage ? (
            <p>{t('permissions.noAccess')}</p>
          ) : null}
        </>
      )}
    </AuthContext.Consumer>
  )
}

export const createCheckedPermissionComponent = (permission: string, showMessage?: boolean) => <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object
>(
  ControlledComponent: ComponentType<P>
) => (props: P) => {
  return (
    <PermissionControl requiredPermission={permission} showMessage={showMessage}>
      <ControlledComponent {...props} />
    </PermissionControl>
  )
}
