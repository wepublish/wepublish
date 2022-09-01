import {Context} from '../../context'
import {AllPermissions, authorise, CanGetPermissions} from '../permissions'

export const getPermissions = (authenticate: Context['authenticate']) => {
  const {roles} = authenticate()
  authorise(CanGetPermissions, roles)

  return AllPermissions
}
