import {z} from 'zod'
import {EmailInput, EmailInputSchema} from './email/email'
import {PhoneInput, PhoneInputSchema} from './phone/phone'
import {URLInput, URLInputSchema} from './url/url'
import {PasswordInput, PasswordInputSchema} from './password/password'
import {TextInput} from './text/text'
import {ZIPInput, ZIPInputSchema} from './zip/zip'
import {CheckboxInput} from './checkbox/checkbox'
import {SelectInput, SelectInputSchema} from './select/select'
import {TagInput, TagInputSchema} from './tag/tag'
import {TextareaInput, TextareaInputSchema} from './textarea/textarea'
import {RatingInput, RatingInputSchema} from './rating/rating'
import {HiddenInput, HiddenInputSchema} from './hidden/hidden'

export const baseFormMapping = [
  [z.string(), TextInput],
  [HiddenInputSchema, HiddenInput],
  [TextareaInputSchema, TextareaInput],
  [z.string().email(), EmailInput],
  [z.boolean(), CheckboxInput],
  [SelectInputSchema, SelectInput],
  [TagInputSchema, TagInput],
  [EmailInputSchema, EmailInput],
  [PhoneInputSchema, PhoneInput],
  [URLInputSchema, URLInput],
  [ZIPInputSchema, ZIPInput],
  [PasswordInputSchema, PasswordInput],
  [RatingInputSchema, RatingInput]
] as const
