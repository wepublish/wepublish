import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

// Same values as GateActionRole, under the name the website already selects.
export enum BannerActionRole {
  PRIMARY = 'PRIMARY',
  CANCEL = 'CANCEL',
  OTHER = 'OTHER',
}

registerEnumType(BannerActionRole, {
  name: 'BannerActionRole',
});

@ObjectType()
export class BannerAction {
  @Field()
  id!: string;

  @Field()
  label!: string;

  @Field()
  url!: string;

  @Field()
  style!: string;

  @Field(() => BannerActionRole)
  role!: BannerActionRole;
}
