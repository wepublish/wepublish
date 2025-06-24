import {Field, Float, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {Tag} from '@wepublish/tag/api'
import {User} from '@wepublish/user/api'
import {Image} from '@wepublish/image/api'
import {Node} from 'slate'
import {GraphQLRichText} from '@wepublish/richtext/api'

export enum CommentAuthorType {
  author = 'author',
  team = 'team',
  verifiedUser = 'verifiedUser',
  guestUser = 'guestUser'
}

registerEnumType(CommentAuthorType, {
  name: 'CommentAuthorType'
})

export enum CommentItemType {
  article,
  page
}

registerEnumType(CommentItemType, {
  name: 'CommentItemType'
})

export enum CommentState {
  approved = 'approved',
  pendingApproval = 'pendingApproval',
  pendingUserChanges = 'pendingUserChanges',
  rejected = 'rejected'
}

registerEnumType(CommentState, {
  name: 'CommentState'
})

export enum RatingSystemType {
  star = 'star'
}

registerEnumType(RatingSystemType, {
  name: 'RatingSystemType'
})

export enum PublicCommentSort {
  rating = 'rating'
}

registerEnumType(PublicCommentSort, {
  name: 'CommentSort'
})

@ObjectType()
export class CommentRatingSystemAnswer {
  @Field()
  id!: string

  @Field()
  ratingSystemId!: string

  @Field(() => String, {nullable: true})
  answer?: string | null

  @Field(() => RatingSystemType)
  type!: RatingSystemType
}

@ObjectType()
export class overriddenRating {
  @Field()
  answerId!: string

  @Field(() => Int, {nullable: true})
  value?: number | null
}

@ObjectType()
export class CommentRating {
  @Field()
  id!: string

  @Field(() => String, {nullable: true})
  userId?: string | null

  @Field()
  commentId!: string

  @Field(() => Int)
  value!: number

  @Field(() => Date)
  createdAt!: Date

  @Field(() => String, {nullable: true})
  fingerprint?: string | null

  @Field(() => Boolean, {nullable: true})
  disabled?: boolean | null

  @Field(() => CommentRatingSystemAnswer)
  answer!: CommentRatingSystemAnswer
}

@ObjectType()
export class CalculatedRating {
  @Field(() => Int)
  count!: number

  @Field(() => Int)
  total!: number

  @Field(() => Float)
  mean!: number

  @Field(() => CommentRatingSystemAnswer)
  answer!: CommentRatingSystemAnswer
}

@ObjectType()
export class FullCommentRatingSystem {
  @Field()
  id!: string

  @Field(() => String, {nullable: true})
  name?: string | null

  @Field(() => [CommentRatingSystemAnswer])
  answers!: CommentRatingSystemAnswer[]
}

@ObjectType()
export class CommentRevision {
  @Field(() => String, {nullable: true})
  title?: string | null

  @Field(() => String, {nullable: true})
  lead?: string | null

  @Field(() => String, {nullable: true})
  text?: string | null

  @Field(() => Date)
  createdAt!: Date
}

@ObjectType()
export class Comment {
  @Field()
  id!: string

  @Field(() => String, {nullable: true})
  parentID?: string | null

  @Field(() => String, {nullable: true})
  guestUsername?: string | null

  guestUserImageID?: string | null

  @Field(() => Image, {nullable: true})
  guestUserImage?: Image | null

  userID?: string | null
  @Field(() => User, {nullable: true})
  user?: User | null

  @Field(() => [Tag])
  tags!: Tag[]

  @Field(() => CommentAuthorType)
  authorType!: CommentAuthorType

  @Field()
  itemID!: string

  @Field(() => CommentItemType)
  itemType!: CommentItemType

  @Field(() => Comment, {nullable: true})
  parentComment?: Comment | null

  @Field(() => String, {nullable: true})
  source?: string | null

  @Field(() => CommentState)
  state!: CommentState

  @Field(() => String, {nullable: true})
  rejectionReason?: string | null

  @Field(() => Boolean, {nullable: true})
  featured?: boolean | null

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  modifiedAt!: Date

  @Field(() => [overriddenRating], {nullable: true})
  overriddenRatings?: overriddenRating[] | null

  @Field(() => [Comment])
  children!: Comment[]

  @Field(() => String, {nullable: true})
  title?: string | null

  @Field(() => String, {nullable: true})
  lead?: string | null

  @Field(() => GraphQLRichText, {nullable: true})
  text?: Node[] | null

  @Field(() => String)
  url?: string

  @Field(() => [CalculatedRating], {nullable: true})
  calculatedRatings?: CalculatedRating[] | null

  @Field(() => [CommentRating], {nullable: true})
  userRatings?: CommentRating[] | null
}
