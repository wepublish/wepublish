import {Context} from '../../context'
import {AllPermissions, CanGetPermissions} from '@wepublish/permissions'
import {authorise} from '../permissions'

export const getPermissions = (authenticate: Context['authenticate']) => {
  const {roles} = authenticate()
  authorise(CanGetPermissions, roles)

  return AllPermissions
}
