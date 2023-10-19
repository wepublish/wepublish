import {
  Field,
  ObjectType,
  ID,
  Int,
  registerEnumType,
  InputType,
  Scalar,
  CustomScalar
} from '@nestjs/graphql'
import {SettingName} from './setting'
import {ValueNode} from 'graphql'

registerEnumType(SettingName, {
  name: 'SettingName'
})

@Scalar('Value', type => GraphQLSettingValueType)
export class GraphQLSettingValueType implements CustomScalar<any, any> {
  description = 'Setting Value'

  serialize(value: any): any {
    return value
  }

  parseValue(value: any): any {
    return value
  }

  parseLiteral(ast: ValueNode): any {
    switch (ast.kind) {
      case 'StringValue':
        return ast.value
      case 'BooleanValue':
        return ast.value
      case 'IntValue':
        return parseInt(ast.value, 10)
      case 'FloatValue':
        return parseFloat(ast.value)
      default:
        throw new Error(`Value scalar error: cannot handle kind: ${ast.kind}`)
    }
  }
}
// @Scalar('Value', type => GraphQLSettingValueType)
// export class GraphQLSettingValueType implements CustomScalar<string, any> {
//   description = 'Setting Value'

//   serialize(value: any): string {
//     return value
//   }

//   parseValue(value: any): any {
//     return value
//   }

//   parseLiteral(ast: ValueNode): any {
//     if (ast.kind === 'StringValue') {
//       return ast.value
//     }
//     throw new Error(`Value scalar error: cannot handle kind: ${ast.kind}`)
//   }
// }

@ObjectType()
export class AllowedSettingVals {
  @Field(type => [String], {nullable: true})
  stringChoice?: string[]

  @Field({nullable: true})
  boolChoice?: boolean
}

@ObjectType()
export class SettingRestriction {
  @Field(type => Int, {nullable: true})
  maxValue?: number

  @Field(type => Int, {nullable: true})
  minValue?: number

  @Field(type => Int, {nullable: true})
  inputLength?: number

  @Field(type => AllowedSettingVals, {nullable: true})
  allowedValues?: AllowedSettingVals
}

@ObjectType()
export class Setting {
  @Field(type => ID)
  id?: string

  @Field(type => SettingName)
  name?: string

  @Field(type => GraphQLSettingValueType, {nullable: true})
  value?: any

  @Field(type => SettingRestriction, {nullable: true})
  settingRestriction?: SettingRestriction
}

@InputType()
export class SettingFilter {
  @Field({nullable: true})
  name?: string
}

@InputType()
export class UpdateSettingInput {
  @Field(type => SettingName)
  name!: SettingName

  @Field(type => GraphQLSettingValueType)
  value!: any
}
