import { Field, ObjectType } from '@nestjs/graphql';
import { TagType } from '@prisma/client';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { Descendant } from 'slate';
import { ColorScalar } from '@wepublish/peering/api';

@ObjectType()
export class Tag {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  tag?: string;

  @Field(() => TagType, { nullable: true })
  type?: TagType;

  @Field()
  main!: boolean;

  @Field(() => GraphQLRichText, { nullable: true })
  description?: Descendant[];

  @Field()
  url!: string;

  @Field(() => ColorScalar, { nullable: true })
  bgColor?: string;
}
