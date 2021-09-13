import { GraphQLNonNull, GraphQLID, GraphQLString, GraphQLObjectType, GraphQLInputObjectType, GraphQLEnumType, GraphQLList, GraphQLInt } from 'graphql';

import { Organisation, OrganisationSort } from '../db/organisation';
import {Context} from '../context'
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLPageInfo } from './common';

export const GraphQLOrganisation = new GraphQLObjectType<Organisation, Context>({
  name: 'Organisation',
  description: 'Organistion types definition',
  fields: {
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'Organisation ID, auto generated'
    },
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Organisation name'
    },
    location: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Organisation Location'
    },
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},
  }
});

export const GraphQLOrganisationInput = new GraphQLInputObjectType({
  name: 'OrganisationInput',
  fields: {
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Organisation name is required'
    },
    location: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Organisation Location is required'
    },
  }
});

export const GraphQLOrganisationFilter = new GraphQLInputObjectType({
  name: 'OrganisationFilter',
  fields: {
    name: {type: GraphQLString},
    location: {type: GraphQLString},
  }
});

export const GraphQLOrganisationSort = new GraphQLEnumType({
  name: 'OrganisationSort',
  values: {
    CREATED_AT: {value: OrganisationSort.CreatedAt},
    MODIFIED_AT: {value: OrganisationSort.ModifiedAt},
    NAME: {value: OrganisationSort.Name},
    LOCATION: {value: OrganisationSort.Location}
  }
});

export const GraphQLOrganisationConnection = new GraphQLObjectType<any, Context>({
  name: 'OrganisationConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLOrganisation)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
});
