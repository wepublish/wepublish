import { Tag, TagType } from '@prisma/client';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { Context } from '../../context';
import { createProxyingResolver } from '../../utility';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { ColorScalar } from '@wepublish/utils/api';

export const GraphQLTagType = new GraphQLEnumType({
  name: 'TagType',
  values: {
    [TagType.Comment]: { value: TagType.Comment },
    [TagType.Event]: { value: TagType.Event },
    [TagType.Author]: { value: TagType.Author },
    [TagType.Article]: { value: TagType.Article },
    [TagType.Page]: { value: TagType.Page },
  },
});

export const GraphQLTag = new GraphQLObjectType<Tag, Context>({
  name: 'Tag',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    tag: { type: GraphQLString },
    type: { type: GraphQLTagType },
    main: { type: new GraphQLNonNull(GraphQLBoolean) },
    description: { type: GraphQLRichText },
    url: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(async (tag, _, { urlAdapter }) => {
        return await urlAdapter.getTagURL(tag);
      }),
    },
    color: { type: ColorScalar },
  },
});
