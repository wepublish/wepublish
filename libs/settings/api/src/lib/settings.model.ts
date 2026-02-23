import {
  Field,
  ObjectType,
  Int,
  registerEnumType,
  InputType,
  Scalar,
  CustomScalar,
  ArgsType,
} from '@nestjs/graphql';
import { SettingName } from './setting';
import { ValueNode } from 'graphql';
import { BadRequestException } from '@nestjs/common';

registerEnumType(SettingName, {
  name: 'SettingName',
});

@Scalar('GraphQLSettingValueType')
export class GraphQLSettingValueType implements CustomScalar<string, any> {
  description = 'Setting Value';

  serialize(value: any): any {
    return value;
  }

  parseValue(value: any): any {
    return value;
  }

  parseLiteral(ast: ValueNode): any {
    switch (ast.kind) {
      case 'StringValue':
        return ast.value;
      case 'BooleanValue':
        return ast.value;
      case 'IntValue':
        return parseInt(ast.value, 10);
      case 'FloatValue':
        return parseFloat(ast.value);
      default:
        throw new BadRequestException(
          `Value scalar error: cannot handle kind: ${ast.kind}`
        );
    }
  }
}

@ObjectType()
export class AllowedSettingVals {
  @Field(type => [String], { nullable: true })
  stringChoice?: string[];

  @Field({ nullable: true })
  boolChoice?: boolean;
}

@ObjectType()
export class SettingRestriction {
  @Field(type => Int, { nullable: true })
  maxValue?: number;

  @Field(type => Int, { nullable: true })
  minValue?: number;

  @Field(type => Int, { nullable: true })
  inputLength?: number;

  @Field(type => AllowedSettingVals, { nullable: true })
  allowedValues?: AllowedSettingVals;
}

@ObjectType()
export class Setting {
  @Field(type => String)
  id!: string;

  @Field(type => SettingName)
  name!: string;

  @Field(type => GraphQLSettingValueType, { nullable: true })
  value?: unknown;

  @Field(type => SettingRestriction, { nullable: true })
  settingRestriction?: SettingRestriction;
}

@InputType()
export class SettingFilter {
  @Field({ nullable: true })
  name?: string;
}

@ArgsType()
export class UpdateSettingInput {
  @Field(type => SettingName)
  name!: SettingName;

  @Field(type => GraphQLSettingValueType, { nullable: true })
  value?: unknown;
}
