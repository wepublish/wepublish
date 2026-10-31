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
  GraphQLArgument,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';

import {
  ArticleRevision,
  ArticleTemplateMetadataInput,
  CreateArticleInput,
  UpdateArticleInput,
} from './article.model';
import { ArticleRevisionResolver } from './article-revision.resolver';

@Resolver()
class ProbeResolver {
  @Query(() => ArticleRevision)
  revision() {
    return null as never;
  }

  @Mutation(() => Boolean)
  create(@Args() input: CreateArticleInput) {
    return !!input;
  }

  @Mutation(() => Boolean)
  update(@Args() input: UpdateArticleInput) {
    return !!input;
  }

  @Mutation(() => Boolean)
  template(@Args('metadata') metadata: ArticleTemplateMetadataInput) {
    return !!metadata;
  }
}

describe('article puck blocks schema', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schema = await module
      .get(GraphQLSchemaFactory)
      .create([ProbeResolver, ArticleRevisionResolver]);
  });

  const mutationArg = (mutation: string, name: string) =>
    schema
      .getMutationType()
      ?.getFields()
      [mutation].args.find((arg: GraphQLArgument) => arg.name === name);

  it('resolves the puck blocks of a revision as an optional flat list', () => {
    const revision = schema.getType('ArticleRevision') as GraphQLObjectType;
    const field = revision.getFields()['puckBlocks'];

    expect(String(field.type)).toBe('[PuckBlock!]');
    expect(field.args.map(arg => [arg.name, String(arg.type)])).toEqual([
      ['onlyDisplayed', 'Boolean!'],
    ]);
    expect(field.args[0].defaultValue).toBe(true);
    expect(revision.getInterfaces().map(String)).toContain('HasPuckBlocks');
  });

  it('declares the puck blocks of the interface as an optional flat list', () => {
    const hasPuckBlocks = schema.getType(
      'HasPuckBlocks'
    ) as GraphQLInterfaceType;

    expect(String(hasPuckBlocks.getFields()['puckBlocks'].type)).toBe(
      '[PuckBlock!]'
    );
  });

  it('tells when the displayed puck blocks change next', () => {
    const revision = schema.getType('ArticleRevision') as GraphQLObjectType;

    expect(revision.getFields()['puckBlocksChangeAt']).toBeDefined();
  });

  it('accepts puck blocks as a tree and makes legacy blocks optional on create', () => {
    expect(String(mutationArg('create', 'puckBlocks')?.type)).toBe(
      '[PuckBlockInput!]'
    );
    expect(String(mutationArg('create', 'blocks')?.type)).toBe(
      '[BlockContentInput!]!'
    );
    expect(mutationArg('create', 'blocks')?.defaultValue).toEqual([]);
  });

  it('carries legacy blocks over when an update leaves them out', () => {
    expect(String(mutationArg('update', 'puckBlocks')?.type)).toBe(
      '[PuckBlockInput!]'
    );
    expect(String(mutationArg('update', 'blocks')?.type)).toBe(
      '[BlockContentInput!]'
    );
    expect(mutationArg('update', 'blocks')?.defaultValue).toBeUndefined();
  });

  it('keeps puck blocks out of template metadata', () => {
    const metadata = schema.getType(
      'ArticleTemplateMetadataInput'
    ) as GraphQLInputObjectType;

    expect(metadata.getFields()['puckBlocks']).toBeUndefined();
    expect(metadata.getFields()['blocks']).toBeUndefined();
  });
});
