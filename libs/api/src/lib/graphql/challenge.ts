import {GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'
import {GraphQLDate} from 'graphql-scalars'
import {GraphQLEnumType} from 'graphql/index'
import {CaptchaType} from './../../lib/challenges/challengeProvider'

export const GraphQLCaptchaType = new GraphQLEnumType({
  name: 'CaptchaType',
  values: {
    ALGEBRAIC: {value: CaptchaType.Algebraic},
    CF_TURNSTILE: {value: CaptchaType.CfTurnstile}
  }
})

export const GraphQLChallenge: GraphQLObjectType<Context> = new GraphQLObjectType<Context>({
  name: 'Challenge',
  fields: () => ({
    type: {type: GraphQLCaptchaType},
    challenge: {type: GraphQLString},
    challengeID: {type: GraphQLString},
    validUntil: {type: GraphQLDate}
  })
})
