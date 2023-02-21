import {applyDecorators} from '@nestjs/common'
import {OneOf} from '@wepublish/authentication/api'
import {AddMetadata} from '@wepublish/nest-modules'
import {PermissionsGuard} from './permission.guard'
import {Permission} from './permissions'

export const PERMISSIONS_METADATA_KEY = 'permissions'

export const Permissions = (...permissions: Permission[]) =>
  applyDecorators(AddMetadata(PERMISSIONS_METADATA_KEY, permissions), OneOf(PermissionsGuard))
