import {registerEnumType} from '@nestjs/graphql'
import {TagType as PrismaTagType} from '@prisma/client'

/**
 * Types of tags - re-export from Prisma
 */
export const TagType = PrismaTagType
export type TagType = PrismaTagType

registerEnumType(TagType, {
  name: 'TagType',
  description: 'Type of tag.'
})
