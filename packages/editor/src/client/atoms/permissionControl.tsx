import React, {ReactElement} from 'react'
import {AuthContext} from '../authContext'
import {authorise} from '../utility'

interface PermissionControlProps {
  children: ReactElement
  requiredPermission: string
}

export function PermissionControl({children, requiredPermission}: PermissionControlProps) {
  return (
    <AuthContext.Consumer>
      {value => <>{authorise(value.session?.roles, requiredPermission) ? children : null}</>}
    </AuthContext.Consumer>
  )
}
