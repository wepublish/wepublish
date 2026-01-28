import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class VersionInformation {
  @Field()
  version!: string;
}
