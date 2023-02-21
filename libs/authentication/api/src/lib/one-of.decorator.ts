import {applyDecorators, CanActivate, Type} from '@nestjs/common'
import {AddMetadata} from '@wepublish/nest-modules'

export const ONE_OF_METADATA_KEY = 'one_of'

export const OneOf = (...guards: Type<CanActivate>[]) =>
  applyDecorators(AddMetadata(ONE_OF_METADATA_KEY, guards))
