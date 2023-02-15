import {SetMetadata} from '@nestjs/common'
import {Permission} from './permissions'

export const PERMISSIONS_METADATA_KEY = 'permissions'

export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, permissions)
