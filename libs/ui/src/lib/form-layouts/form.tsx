import {ArrayInput, ArrayInputSchema} from '../form-domain/array/array'
import {domainFormMapping} from '../form-domain/form'
import {baseFormMapping} from '../form/form'

export const formMapping = [
  ...baseFormMapping,
  ...domainFormMapping,
  [ArrayInputSchema, ArrayInput]
] as const
