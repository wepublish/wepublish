import {FormSchemaMapping} from '@wepublish/website/form-builder'
import {ArrayInput} from '../form-domain/array/array'
import {domainFormMapping} from '../form-domain/form'
import {baseFormMapping} from '../form/form'
import * as v from 'valibot'

export const formMapping: FormSchemaMapping = [
  ...baseFormMapping,
  ...domainFormMapping,
  [v.array(v.object({})), ArrayInput]
] as const
