import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { BannerActionRole } from '@prisma/client';

@ArgsType()
export class BannerActionArgs {
  @Field()
  bannerId!: string;
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

@InputType()
export class CreateBannerActionInput extends PickType(
  BannerAction,
  ['label', 'url', 'style', 'role'],
  InputType
) {}

@InputType()
export class UpdateBannerActionInput extends PickType(
  BannerAction,
  ['id', 'label', 'url', 'style', 'role'],
  InputType
) {}
