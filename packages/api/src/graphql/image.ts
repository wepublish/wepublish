import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLInputObjectType
} from 'graphql'

import {Context} from '../context'
import {Image} from '../adapter/image'
import {GraphQLPageInfo} from './pageInfo'

export const GraphQLFocusPoint = new GraphQLObjectType<any, Context>({
  name: 'Point',
  fields: {
    x: {type: GraphQLNonNull(GraphQLFloat)},
    y: {type: GraphQLNonNull(GraphQLFloat)},
    scale: {type: GraphQLNonNull(GraphQLFloat)}
  }
})

export const GraphQLImageRotation = new GraphQLEnumType({
  name: 'ImageRotation',
  values: {
    AUTO: {value: 'auto'},
    ROTATE_0: {value: '0'},
    ROTATE_90: {value: '90'},
    ROTATE_180: {value: '180'},
    ROTATE_270: {value: '270'}
  }
})

export const GraphQLImageOutput = new GraphQLEnumType({
  name: 'ImageOutput',
  values: {
    PNG: {value: 'png'},
    JPEG: {value: 'jpeg'},
    WEBP: {value: 'webp'}
  }
})

export const GraphQLImageTransformation = new GraphQLInputObjectType({
  name: 'ImageTransformation',
  fields: {
    width: {type: GraphQLInt},
    height: {type: GraphQLInt},
    rotation: {type: GraphQLImageRotation},
    quality: {type: GraphQLFloat},
    output: {type: GraphQLImageOutput}
  }
})

export const GraphQLImage = new GraphQLObjectType<Image, Context>({
  name: 'Image',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    filename: {type: GraphQLNonNull(GraphQLString)},
    fileSize: {type: GraphQLNonNull(GraphQLInt)},
    extension: {type: GraphQLNonNull(GraphQLString)},
    mimeType: {type: GraphQLNonNull(GraphQLString)},
    format: {type: GraphQLNonNull(GraphQLString)},
    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    url: {type: GraphQLNonNull(GraphQLString)},
    width: {type: GraphQLNonNull(GraphQLInt)},
    height: {type: GraphQLNonNull(GraphQLInt)},
    focusPoint: {type: GraphQLFocusPoint},
    transform: {
      type: GraphQLNonNull(GraphQLList(GraphQLString)),
      args: {transformations: {type: GraphQLList(GraphQLImageTransformation)}},
      resolve(image, {transformations}, {mediaAdapter}) {
        return Promise.all(
          transformations.map((transformation: any) =>
            mediaAdapter.getImageURLForTransformation(image, transformation)
          )
        )
      }
    }
  }
})

export const GraphQLImageConnection = new GraphQLObjectType<any, Context>({
  name: 'ImageConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLImage)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)}
  }
})
