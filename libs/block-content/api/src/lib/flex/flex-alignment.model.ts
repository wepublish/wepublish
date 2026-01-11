import { ObjectType, Field, Int, InputType, OmitType } from '@nestjs/graphql';

@ObjectType()
export class FlexAlignment {
  @Field()
  i!: string;

  @Field(() => Int)
  x!: number;
  @Field(() => Int)
  y!: number;

  @Field(() => Int)
  w!: number;
  @Field(() => Int)
  h!: number;

  @Field({ nullable: true })
  static?: boolean;
}

@InputType()
export class FlexAlignmentInput extends OmitType(
  FlexAlignment,
  [] as const,
  InputType
) {}
