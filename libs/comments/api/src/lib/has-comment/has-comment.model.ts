import { Field, InterfaceType } from '@nestjs/graphql';
import { Comment } from '../comment.model';

@InterfaceType()
export abstract class HasOptionalComment {
  @Field({ nullable: true })
  commentId?: string;

  @Field(() => Comment, { nullable: true })
  comment?: Comment;
}

@InterfaceType()
export abstract class HasComment {
  @Field()
  commentId!: string;

  @Field(() => Comment)
  comment!: Comment;
}
