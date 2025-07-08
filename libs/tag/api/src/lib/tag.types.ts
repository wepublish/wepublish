import {registerEnumType} from '@nestjs/graphql'
import {TagType} from '@prisma/client'

registerEnumType(TagType, {
  name: 'TagType',
  description: 'Type of tag.'
})
