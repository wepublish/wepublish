import { Test } from '@nestjs/testing';
import {
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import { PuckBlock, PuckBlockStyling } from '@wepublish/puck-content/api';

import { PuckBlockResolver } from './puck-block.resolver';
import { PuckBlockStylingResolver } from './puck-block-styling.resolver';
import { PuckBlocksPreviewResolver } from './puck-blocks-preview.resolver';

@Resolver()
class ProbeResolver {
  @Query(() => [PuckBlock])
  blocks() {
    return [];
  }

  @Query(() => PuckBlockStyling)
  styling() {
    return null as never;
  }
}

describe('puck block data schema', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schema = await module
      .get(GraphQLSchemaFactory)
      .create([
        ProbeResolver,
        PuckBlockResolver,
        PuckBlockStylingResolver,
        PuckBlocksPreviewResolver,
      ]);
  });

  const fieldsOf = (name: string) => {
    const type = schema.getType(name) as
      GraphQLObjectType | GraphQLInputObjectType | undefined;

    return Object.fromEntries(
      Object.values(type?.getFields() ?? {}).map(field => [
        field.name,
        String(field.type),
      ])
    );
  };

  it('resolves the records of every block', () => {
    expect(fieldsOf('PuckBlock')['data']).toBe('PuckBlockData!');
  });

  it('lists the records per model, null where the block has no datasource', () => {
    expect(fieldsOf('PuckBlockData')).toEqual({
      articles: '[Article!]',
      pages: '[Page!]',
      events: '[Event!]',
      images: '[Image!]',
      memberPlans: '[MemberPlan!]',
    });
  });

  it('resolves the background image on reads only', () => {
    expect(fieldsOf('PuckBlockStyling')['backgroundImageObject']).toBe('Image');
    expect(
      fieldsOf('PuckBlockStylingInput')['backgroundImageObject']
    ).toBeUndefined();
  });

  it('previews unsaved blocks and registry', () => {
    const field = schema.getQueryType()?.getFields()['puckBlocksPreview'];

    expect(String(field?.type)).toBe('PuckBlocksPreview!');
    expect(field?.args.map(arg => [arg.name, String(arg.type)])).toEqual([
      ['puckBlocks', '[PuckBlockInput!]!'],
      ['puckRegistry', 'PuckRegistryInput'],
    ]);
  });
});
