import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GraphQLDate } from 'graphql-scalars';

export enum CaptchaType {
  CfTurnstile = 'CfTurnstile',
}

registerEnumType(CaptchaType, {
  name: 'CaptchaType',
});

@ObjectType()
export class Challenge {
  @Field(() => CaptchaType)
  type!: CaptchaType;

  @Field(() => String, { nullable: true })
  challenge?: string;

  @Field(() => String, { nullable: true })
  challengeID?: string;

  @Field(() => GraphQLDate, { nullable: true })
  validUntil?: Date;
}

export type ChallengeValidationProps = {
  challengeID?: string;
  solution: number | string;
};

export type ChallengeValidationReturn = {
  result: string;
  message: string;
  valid: boolean;
};
