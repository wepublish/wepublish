import {Permission} from './permissions'
import {TypeMetadataStorage} from '@nestjs/graphql'

export function FieldPermissions(...permissions: Permission[]): PropertyDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    TypeMetadataStorage.addExtensionsPropertyMetadata({
      target: target.constructor,
      fieldName: propertyKey as string,
      value: {permissions}
    })
  }
}
