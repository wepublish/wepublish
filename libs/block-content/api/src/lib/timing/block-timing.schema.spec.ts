import { Test } from '@nestjs/testing';
import {
  Args,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import { BaseBlockResolver } from '../base-block.resolver';
import { TitleBlock, TitleBlockInput } from '../title/title-block.model';

@Resolver()
class ProbeResolver {
  @Query(() => TitleBlock)
  title() {
    return null as never;
  }

  @Mutation(() => TitleBlock)
  setTitle(@Args('input') input: TitleBlockInput) {
    return input as never;
  }
}

describe('block timing schema', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schema = await new Promise(resolve =>
      module
        .get(GraphQLSchemaFactory)
        .create([ProbeResolver, BaseBlockResolver])
        .then(resolve)
    );
  });

  it('exposes timing on the base block interface', () => {
    const baseBlock = schema.getType('BaseBlock') as GraphQLInterfaceType;

    expect(String(baseBlock.getFields()['timing'].type)).toBe('BlockTiming');
  });

  it('exposes timing on every block input without per block overrides', () => {
    const input = schema.getType('TitleBlockInput') as GraphQLInputObjectType;

    expect(String(input.getFields()['timing'].type)).toBe('BlockTimingInput');
  });

  it('resolves shouldDisplay on every block but never asks for it as input', () => {
    const block = schema.getType('TitleBlock') as GraphQLObjectType;
    const input = schema.getType('TitleBlockInput') as GraphQLInputObjectType;

    expect(String(block.getFields()['shouldDisplay'].type)).toBe('Boolean!');
    expect(input.getFields()['shouldDisplay']).toBeUndefined();
  });
});
