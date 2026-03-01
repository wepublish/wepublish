import {
  Field,
  ObjectType,
  InputType,
  ArgsType,
  registerEnumType,
} from '@nestjs/graphql';

export enum ExternalAppsTarget {
  BLANK = 'BLANK',
  IFRAME = 'IFRAME',
}

registerEnumType(ExternalAppsTarget, {
  name: 'ExternalAppsTarget',
});

@ObjectType()
export class ExternalApp {
  @Field(type => String)
  id!: string;

  @Field(type => Date)
  createdAt!: Date;

  @Field(type => Date)
  modifiedAt!: Date;

  @Field(type => String)
  name!: string;

  @Field(type => String)
  url!: string;

  @Field(type => ExternalAppsTarget)
  target!: ExternalAppsTarget;

  @Field(type => String, { nullable: true })
  icon?: string | null;
}

@InputType()
export class ExternalAppFilter {
  @Field(type => String, { nullable: true })
  id?: string;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => ExternalAppsTarget, { nullable: true })
  target?: ExternalAppsTarget;
}

@InputType()
export class CreateExternalAppInput {
  @Field(type => String)
  name!: string;

  @Field(type => String)
  url!: string;

  @Field(type => ExternalAppsTarget)
  target!: ExternalAppsTarget;

  @Field(type => String, { nullable: true })
  icon?: string;
}

@ObjectType()
export class ExternalAppToken {
  @Field(type => String)
  token!: string;

  @Field(type => Date)
  expiresAt!: Date;
}

@ArgsType()
export class UpdateExternalAppInput {
  @Field(type => String)
  id!: string;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  url?: string;

  @Field(type => ExternalAppsTarget, { nullable: true })
  target?: ExternalAppsTarget;

  @Field(type => String, { nullable: true })
  icon?: string;
}
