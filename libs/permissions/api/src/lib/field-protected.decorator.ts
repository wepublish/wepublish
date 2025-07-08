import {Permission} from './permissions'
import {applyDecorators} from '@nestjs/common'
import {FieldPermissions} from './field-permission.decorator'
import {FieldMiddlewarePermissions} from './field-permissions.middleware'
import {
  GqlTypeReference,
  ReturnTypeFunc,
  ReturnTypeFuncValue
} from '@nestjs/graphql/dist/interfaces/return-type-func.interface'
import {FieldOptions} from '@nestjs/graphql/dist/decorators/field.decorator'
import {Field} from '@nestjs/graphql'
import {isFunction} from '@nestjs/common/utils/shared.utils'

export interface FieldProtectedOptions<T> extends Omit<FieldOptions<T>, 'nullable'> {
  permissions: Permission[]
}

export type FieldOptionsExtractor<T> = T extends [GqlTypeReference<infer P>]
  ? FieldProtectedOptions<P[]>
  : T extends GqlTypeReference<infer P>
  ? FieldProtectedOptions<P>
  : never

export function FieldProtected<T extends ReturnTypeFuncValue = any>(
  options: FieldOptionsExtractor<T>
): PropertyDecorator
export function FieldProtected<T extends ReturnTypeFuncValue = any>(
  returnTypeFunc: ReturnTypeFunc<T>,
  options: FieldOptionsExtractor<T>
): PropertyDecorator
export function FieldProtected<T extends ReturnTypeFuncValue = any>(
  typeOrOptions: ReturnTypeFunc<T> | FieldOptionsExtractor<T>,
  fieldOptions?: FieldOptionsExtractor<T>
): PropertyDecorator {
  const [typeFunc, options = {}] = isFunction(typeOrOptions)
    ? [typeOrOptions, fieldOptions]
    : [undefined, typeOrOptions as any]

  const {permissions, middleware, ...otherOptions} = options

  return applyDecorators(
    FieldPermissions(...permissions),
    Field(typeFunc, {
      ...otherOptions,
      nullable: true,
      middleware: [...(middleware ?? []), FieldMiddlewarePermissions]
    })
  )
}
