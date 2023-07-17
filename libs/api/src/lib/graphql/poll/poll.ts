import {
  Poll,
  PollAnswer,
  PollExternalVote,
  PollExternalVoteSource,
  PollVote,
  Prisma
} from '@prisma/client'
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLError,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  Kind
} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Context} from '../../context'
import {ConnectionResult} from '../../db/common'
import {GraphQLPageInfo} from '../common'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {PollSort} from './poll.private-queries'

const validateVoteValue = (voteValue: unknown): number => {
  if (typeof voteValue !== 'number') {
    throw new GraphQLError(`Value is not a number: ${voteValue}`)
  }

  if (voteValue < 0) {
    throw new GraphQLError(`Value can not be below 0.`)
  }

  return voteValue
}

export const VoteValue = new GraphQLScalarType({
  name: 'VoteValue',
  description: 'A valid vote value',
  serialize: validateVoteValue,
  parseValue: validateVoteValue,
  parseLiteral: ast => {
    if (ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Query error: Can only parse numbers as vote values but got a: ${ast.kind}`
      )
    }

    return validateVoteValue(ast.value)
  }
})

export const GraphQLPoll = new GraphQLObjectType<Poll, Context>({
  name: 'Poll',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    question: {type: GraphQLString},
    opensAt: {type: GraphQLNonNull(GraphQLDateTime)},
    closedAt: {type: GraphQLDateTime}
  }
})

export const GraphQLPollAnswer = new GraphQLObjectType<PollAnswer, Context>({
  name: 'PollAnswer',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    pollId: {type: GraphQLNonNull(GraphQLID)},
    answer: {type: GraphQLString}
  }
})

export const GraphQLPollAnswerWithVoteCount = new GraphQLObjectType<
  PollAnswer & {
    _count: Prisma.PollAnswerCountOutputType
  },
  Context
>({
  name: 'PollAnswerWithVoteCount',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    pollId: {type: GraphQLNonNull(GraphQLID)},
    answer: {type: GraphQLString},
    votes: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: pollAnswer => pollAnswer._count.votes
    }
  }
})

export const GraphQLPollVote = new GraphQLObjectType<PollVote, Context>({
  name: 'PollVote',
  fields: {
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    fingerprint: {type: GraphQLString},
    disabled: {type: GraphQLBoolean}
  }
})

export const GraphQLPollExternalVote = new GraphQLObjectType<PollExternalVote, Context>({
  name: 'PollExternalVote',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    answerId: {type: GraphQLNonNull(GraphQLID)},
    amount: {type: VoteValue}
  }
})

export const GraphQLPollExternalVoteSource = new GraphQLObjectType<PollExternalVoteSource, Context>(
  {
    name: 'PollExternalVoteSource',
    fields: {
      id: {type: GraphQLNonNull(GraphQLID)},
      source: {type: GraphQLString},
      voteAmounts: {type: GraphQLList(GraphQLNonNull(GraphQLPollExternalVote))}
    }
  }
)

export const GraphQLPollConnection = new GraphQLObjectType<ConnectionResult<Poll>, Context>({
  name: 'PollConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPoll)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPollFilter = new GraphQLInputObjectType({
  name: 'PollFilter',
  fields: {
    openOnly: {type: GraphQLBoolean}
  }
})

export const GraphQLPollSort = new GraphQLEnumType({
  name: 'PollSort',
  values: {
    OPENS_AT: {value: PollSort.OpensAt},
    CREATED_AT: {value: PollSort.CreatedAt},
    MODIFIED_AT: {value: PollSort.ModifiedAt}
  }
})

export const GraphQLPollWithAnswers = new GraphQLObjectType<Poll, Context>({
  name: 'PollWithAnswers',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    question: {type: GraphQLString},
    opensAt: {type: GraphQLNonNull(GraphQLDateTime)},
    closedAt: {type: GraphQLDateTime},
    answers: {
      type: GraphQLList(GraphQLNonNull(GraphQLPollAnswer))
    }
  }
})

export const GraphQLFullPoll = new GraphQLObjectType<Poll, Context>({
  name: 'FullPoll',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    question: {type: GraphQLString},
    opensAt: {type: GraphQLNonNull(GraphQLDateTime)},
    closedAt: {type: GraphQLDateTime},
    infoText: {type: GraphQLRichText},

    answers: {
      type: GraphQLList(GraphQLNonNull(GraphQLPollAnswerWithVoteCount))
    },

    externalVoteSources: {
      type: GraphQLList(GraphQLNonNull(GraphQLPollExternalVoteSource))
    }
  }
})

export const GraphQLUpdatePollAnswer = new GraphQLInputObjectType({
  name: 'UpdatePollAnswer',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    answer: {type: GraphQLString}
  }
})

export const GraphQLUpdatePollExternalVote = new GraphQLInputObjectType({
  name: 'UpdatePollExternalVote',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    amount: {type: VoteValue}
  }
})

export const GraphQLUpdatePollExternalVoteSources = new GraphQLInputObjectType({
  name: 'UpdatePollExternalVoteSources',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    source: {type: GraphQLString},
    voteAmounts: {type: GraphQLList(GraphQLNonNull(GraphQLUpdatePollExternalVote))}
  }
})
