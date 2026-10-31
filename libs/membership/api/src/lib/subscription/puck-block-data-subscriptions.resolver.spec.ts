import { Test } from '@nestjs/testing';
import {
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Subscription } from '@prisma/client';
import {
  emptyPuckBlockData,
  PuckBlockData,
} from '@wepublish/block-content/api';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';

import { PuckBlockDataSubscriptionsResolver } from './puck-block-data-subscriptions.resolver';

@Resolver()
class ProbeResolver {
  @Query(() => PuckBlockData)
  data() {
    return emptyPuckBlockData;
  }
}

describe('PuckBlockDataSubscriptionsResolver', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schema = await module
      .get(GraphQLSchemaFactory)
      .create([ProbeResolver, PuckBlockDataSubscriptionsResolver]);
  });

  it('lists the subscriptions of the reader with the records of a Puck block', () => {
    const field = (
      schema.getType('PuckBlockData') as GraphQLObjectType
    ).getFields()['userSubscriptions'];

    expect(String(field?.type)).toBe('[PublicSubscription!]');
  });

  it.each([
    ['the subscriptions the block yields', [{ id: 's1' } as Subscription]],
    ['none for a block without a subscription datasource', null],
  ])('hands on %s', (_, userSubscriptions) => {
    expect(
      new PuckBlockDataSubscriptionsResolver().userSubscriptions({
        ...emptyPuckBlockData,
        userSubscriptions,
      })
    ).toBe(userSubscriptions);
  });
});
