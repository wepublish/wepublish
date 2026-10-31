import { Test } from '@nestjs/testing';
import {
  Args,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
} from 'graphql';

import { HasPuckBlocks } from './has-puck-blocks.model';
import { PuckBlock, PuckBlockInput } from './puck-block.model';
import {
  apiBlockStylingKeys,
  puckBackgroundSizes,
  puckBorderStyles,
  puckBreakpoints,
  puckDatasourceTypes,
  puckFontWeights,
  puckListDatasourceTypes,
  puckTextAligns,
  puckTextTransforms,
  puckWeekdays,
} from './puck-blocks';

@ObjectType({ implements: () => [HasPuckBlocks] })
class ProbeDocument implements HasPuckBlocks {
  @Field(() => String)
  id!: string;
}

@Resolver()
class ProbeResolver {
  @Query(() => [PuckBlock])
  blocks() {
    return [];
  }

  @Query(() => ProbeDocument)
  document() {
    return null as never;
  }

  @Mutation(() => Boolean)
  save(
    @Args('blocks', { type: () => [PuckBlockInput] }) blocks: PuckBlockInput[]
  ) {
    return !!blocks;
  }
}

describe('puck block schema', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    schema = await module
      .get(GraphQLSchemaFactory)
      .create([ProbeResolver], { orphanedTypes: [ProbeDocument] });
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

  const enumValuesOf = (name: string) =>
    (schema.getType(name) as GraphQLEnumType)
      .getValues()
      .map(({ name: valueName, value }) => [valueName, value]);

  it('reads blocks as a flat list that points at the parent slot', () => {
    expect(fieldsOf('PuckBlock')).toEqual({
      id: 'String!',
      type: 'String!',
      parentId: 'String',
      slot: 'String',
      position: 'Int!',
      locked: 'Boolean',
      visibility: 'PuckBlockVisibility',
      styling: 'PuckBlockStyling',
      datasources: 'PuckBlockDatasources',
      data: 'JSONObject!',
    });
  });

  it('writes blocks as a tree of any depth', () => {
    expect(fieldsOf('PuckBlockInput')).toEqual({
      id: 'String!',
      type: 'String!',
      data: 'JSONObject!',
      locked: 'Boolean',
      visibility: 'PuckBlockVisibilityInput',
      styling: 'PuckBlockStylingInput',
      datasources: 'PuckBlockDatasourcesInput',
      slot: 'String',
      children: '[PuckBlockInput!]',
    });
  });

  it('declares the puck blocks of a document as a flat list', () => {
    const hasPuckBlocks = schema.getType(
      'HasPuckBlocks'
    ) as GraphQLInterfaceType;

    expect(String(hasPuckBlocks.getFields()['puckBlocks'].type)).toBe(
      '[PuckBlock!]'
    );
  });

  it.each([
    ['PuckBlockVisibility', ''],
    ['PuckBlockVisibilityInput', 'Input'],
  ])('types the visibility of %s', (name, suffix) => {
    expect(fieldsOf(name)).toEqual({
      disabled: 'Boolean',
      timings: `PuckBlockTimings${suffix}`,
      breakpoints: '[PuckBreakpoint!]',
    });
    expect(fieldsOf(`PuckBlockTimings${suffix}`)).toEqual({
      from: 'DateTime',
      to: 'DateTime',
      weekdays: '[PuckWeekday!]',
      timeOfDay: `PuckBlockTimeOfDay${suffix}`,
    });
    expect(fieldsOf(`PuckBlockTimeOfDay${suffix}`)).toEqual({
      from: 'String!',
      to: 'String!',
    });
  });

  it.each([
    ['PuckBlockDatasources', ''],
    ['PuckBlockDatasourcesInput', 'Input'],
  ])('types the datasources of %s without resolved data', (name, suffix) => {
    expect(fieldsOf(name)).toEqual({
      article: `PuckBlockDatasource${suffix}`,
      page: `PuckBlockDatasource${suffix}`,
      event: `PuckBlockDatasource${suffix}`,
      image: `PuckBlockDatasource${suffix}`,
      memberPlan: `PuckBlockDatasource${suffix}`,
      userSubscription: `PuckBlockListDatasource${suffix}`,
    });
    expect(fieldsOf(`PuckBlockDatasource${suffix}`)).toEqual({
      type: 'PuckDatasourceType!',
      id: 'String',
      ids: '[String!]',
    });
    expect(fieldsOf(`PuckBlockListDatasource${suffix}`)).toEqual({
      type: 'PuckListDatasourceType!',
    });
  });

  it.each([
    ['PuckBlockStyling', ''],
    ['PuckBlockStylingInput', 'Input'],
  ])('types every styling key of %s', (name, suffix) => {
    expect(fieldsOf(name)).toEqual({
      typography: 'String',
      textAlign: 'PuckTextAlign',
      color: 'String',
      fontWeight: 'PuckFontWeight',
      textTransform: 'PuckTextTransform',
      background: 'String',
      backgroundImage: 'String',
      backgroundSize: 'PuckBackgroundSize',
      backgroundPosition: 'PuckBackgroundPosition',
      overlay: 'String',
      overlayOpacity: 'Float',
      margin: `PuckSpacingSides${suffix}`,
      padding: `PuckSpacingSides${suffix}`,
      border: `PuckBorder${suffix}`,
      borderRadius: `PuckBorderRadius${suffix}`,
      minHeight: 'PuckMinHeight',
      maxWidth: 'PuckMaxWidth',
      shadow: 'Int',
      opacity: 'Float',
    });
    expect(Object.keys(fieldsOf(name))).toEqual(apiBlockStylingKeys);
    expect(fieldsOf(`PuckSpacingSides${suffix}`)).toEqual({
      top: 'PuckSpacing',
      right: 'PuckSpacing',
      bottom: 'PuckSpacing',
      left: 'PuckSpacing',
    });
    expect(fieldsOf(`PuckBorder${suffix}`)).toEqual({
      width: `PuckBorderWidth${suffix}`,
      style: 'PuckBorderStyle',
      color: 'String',
    });
    expect(fieldsOf(`PuckBorderWidth${suffix}`)).toEqual({
      top: 'Float',
      right: 'Float',
      bottom: 'Float',
      left: 'Float',
    });
    expect(fieldsOf(`PuckBorderRadius${suffix}`)).toEqual({
      topLeft: 'PuckSpacing',
      topRight: 'PuckSpacing',
      bottomRight: 'PuckSpacing',
      bottomLeft: 'PuckSpacing',
    });
  });

  it.each<[string, readonly string[]]>([
    ['PuckWeekday', puckWeekdays],
    ['PuckBreakpoint', puckBreakpoints],
    ['PuckDatasourceType', puckDatasourceTypes],
    ['PuckListDatasourceType', puckListDatasourceTypes],
    ['PuckTextAlign', puckTextAligns],
    ['PuckFontWeight', puckFontWeights],
    ['PuckTextTransform', puckTextTransforms],
    ['PuckBackgroundSize', puckBackgroundSizes],
    ['PuckBorderStyle', puckBorderStyles],
  ])('names the %s values exactly as they are stored', (name, values) => {
    expect(enumValuesOf(name)).toEqual(values.map(value => [value, value]));
  });

  it.each([
    'PuckSpacing',
    'PuckMinHeight',
    'PuckMaxWidth',
    'PuckBackgroundPosition',
  ])('declares the %s scalar', name => {
    expect(schema.getType(name)).toBeInstanceOf(GraphQLScalarType);
  });
});
