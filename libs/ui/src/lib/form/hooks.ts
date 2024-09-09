import {useFieldInfo} from '@ts-react/form'
import {RTFSupportedZodTypes} from '@ts-react/form'
import {RTFBaseZodType} from '@ts-react/form/lib/src/supportedZodTypes'
import {z, ZodFirstPartyTypeKind} from 'zod'

export const isEnum = (zodType: RTFBaseZodType): zodType is z.ZodEnum<any> => {
  return zodType._def.typeName === ZodFirstPartyTypeKind.ZodEnum
}

export const isArray = (zodType: RTFBaseZodType): zodType is z.ZodEnum<any> => {
  return zodType._def.typeName === ZodFirstPartyTypeKind.ZodArray
}

export const deepUnwrap = (zodType: RTFSupportedZodTypes): RTFBaseZodType => {
  let unwrapperZodType = zodType

  while ('unwrap' in unwrapperZodType) {
    unwrapperZodType = unwrapperZodType.unwrap()
  }

  return unwrapperZodType
}

export const useExtractEnumValues = () => {
  const {zodType} = useFieldInfo()
  const unwrappedZodType = deepUnwrap(zodType)

  if (isEnum(unwrappedZodType)) {
    return Object.values(unwrappedZodType.enum) as string[]
  }

  return undefined
}
