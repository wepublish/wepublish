import {DataloaderService} from '@wepublish/utils/api'
import {AllPermissions, Permission} from './permissions'

export class PermissionDataloader extends DataloaderService<Permission> {
  protected loadByKeys(keys: string[]): Promise<(Permission | null)[]> {
    return Promise.resolve(
      keys.map(id => AllPermissions.find(permission => id === permission.id) ?? null)
    )
  }
}
