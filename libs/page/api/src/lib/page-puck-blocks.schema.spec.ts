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
  PageRevision,
  PageTemplateMetadataInput,
  CreatePageInput,
  UpdatePageInput,
} from './page.model';
import { PageRevisionResolver } from './page-revision.resolver';
import {
  CreatePageTemplateInput,
  UpdatePageTemplateInput,
} from './page-template/page-template.model';
import { BlockTemplate } from '@wepublish/block-content/api';

@Resolver()
class ProbeResolver {
  @Query(() => PageRevision)
  revision() {
    return null as never;
  }

  @Query(() => BlockTemplate)
  blockTemplate() {
    return null as never;
  }

  @Mutation(() => Boolean)
  createTemplate(@Args() input: CreatePageTemplateInput) {
    return !!input;
  }

  @Mutation(() => Boolean)
  updateTemplate(@Args() input: UpdatePageTemplateInput) {
    return !!input;
  }

  @Mutation(() => Boolean)
  create(@Args() input: CreatePageInput) {
    return !!input;
  }

  @Mutation(() => Boolean)
  update(@Args() input: UpdatePageInput) {
    return !!input;
  }

  @Mutation(() => Boolean)
  template(@Args('metadata') metadata: PageTemplateMetadataInput) {
    return !!metadata;
  }
}

describe('page puck blocks schema', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schema = await module
      .get(GraphQLSchemaFactory)
      .create([ProbeResolver, PageRevisionResolver]);
  });

  const mutationArg = (mutation: string, name: string) =>
    schema
      .getMutationType()
      ?.getFields()
      [mutation].args.find((arg: GraphQLArgument) => arg.name === name);

  it('resolves the puck blocks of a revision as an optional flat list', () => {
    const revision = schema.getType('PageRevision') as GraphQLObjectType;
    const field = revision.getFields()['puckBlocks'];

    expect(String(field.type)).toBe('[PuckBlock!]');
    expect(field.args.map(arg => [arg.name, String(arg.type)])).toEqual([
      ['onlyDisplayed', 'Boolean!'],
    ]);
    expect(field.args[0].defaultValue).toBe(true);
    expect(revision.getInterfaces().map(String)).toContain('HasPuckBlocks');
  });

  it('resolves the puck registry of a revision', () => {
    const revision = schema.getType('PageRevision') as GraphQLObjectType;

    expect(String(revision.getFields()['puckRegistry'].type)).toBe(
      'PuckRegistry'
    );
  });

  it('declares the puck registry on the interface', () => {
    const hasPuckBlocks = schema.getType(
      'HasPuckBlocks'
    ) as GraphQLInterfaceType;

    expect(String(hasPuckBlocks.getFields()['puckRegistry'].type)).toBe(
      'PuckRegistry'
    );
  });

  it.each(['create', 'update'])(
    'accepts an optional puck registry on %s',
    mutation => {
      expect(String(mutationArg(mutation, 'puckRegistry')?.type)).toBe(
        'PuckRegistryInput'
      );
      expect(
        mutationArg(mutation, 'puckRegistry')?.defaultValue
      ).toBeUndefined();
    }
  );

  it('declares the puck blocks of the interface as an optional flat list', () => {
    const hasPuckBlocks = schema.getType(
      'HasPuckBlocks'
    ) as GraphQLInterfaceType;

    expect(String(hasPuckBlocks.getFields()['puckBlocks'].type)).toBe(
      '[PuckBlock!]'
    );
  });

  it('tells when the displayed puck blocks change next', () => {
    const revision = schema.getType('PageRevision') as GraphQLObjectType;

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
      'PageTemplateMetadataInput'
    ) as GraphQLInputObjectType;

    expect(metadata.getFields()['puckBlocks']).toBeUndefined();
    expect(metadata.getFields()['puckRegistry']).toBeUndefined();
    expect(metadata.getFields()['blocks']).toBeUndefined();
  });
  it('resolves the puck document of a template like the one of a revision', () => {
    const template = schema.getType('BlockTemplate') as GraphQLObjectType;

    expect(String(template.getFields()['puckBlocks'].type)).toBe(
      '[PuckBlock!]'
    );
    expect(String(template.getFields()['puckRegistry'].type)).toBe(
      'PuckRegistry'
    );
    expect(template.getInterfaces().map(String)).toContain('HasPuckBlocks');
  });

  it('accepts a puck document and makes legacy blocks optional when creating a template', () => {
    expect(String(mutationArg('createTemplate', 'puckBlocks')?.type)).toBe(
      '[PuckBlockInput!]'
    );
    expect(String(mutationArg('createTemplate', 'puckRegistry')?.type)).toBe(
      'PuckRegistryInput'
    );
    expect(String(mutationArg('createTemplate', 'blocks')?.type)).toBe(
      '[BlockContentInput!]!'
    );
    expect(mutationArg('createTemplate', 'blocks')?.defaultValue).toEqual([]);
  });

  it('carries the content of a template over when an update leaves it out', () => {
    expect(String(mutationArg('updateTemplate', 'puckBlocks')?.type)).toBe(
      '[PuckBlockInput!]'
    );
    expect(String(mutationArg('updateTemplate', 'puckRegistry')?.type)).toBe(
      'PuckRegistryInput'
    );
    expect(String(mutationArg('updateTemplate', 'blocks')?.type)).toBe(
      '[BlockContentInput!]'
    );
  });
});
