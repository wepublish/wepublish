import { Field, InterfaceType } from '@nestjs/graphql';

@InterfaceType({
  isAbstract: true,
})
export class SettingProvider {
  @Field()
  id!: string;

  @Field(type => Date)
  createdAt!: Date;

  @Field(type => Date)
  modifiedAt!: Date;

  @Field(type => Date)
  lastLoadedAt!: Date;

  @Field({ nullable: true })
  name?: string;
}
