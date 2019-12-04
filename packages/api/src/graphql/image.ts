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
import {Image, ImageRotation, ImageOutput} from '../adapter/image'
import {GraphQLPageInfo} from './pageInfo'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLInputPoint = new GraphQLInputObjectType({
  name: 'InputPoint',
  fields: {
    x: {type: GraphQLNonNull(GraphQLFloat)},
    y: {type: GraphQLNonNull(GraphQLFloat)}
  }
})

export const GraphQLPoint = new GraphQLObjectType<any, Context>({
  name: 'Point',
  fields: {
    x: {type: GraphQLNonNull(GraphQLFloat)},
    y: {type: GraphQLNonNull(GraphQLFloat)}
  }
})

export const GraphQLImageRotation = new GraphQLEnumType({
  name: 'ImageRotation',
  values: {
    AUTO: {value: ImageRotation.Auto},
    ROTATE_0: {value: ImageRotation.Rotate0},
    ROTATE_90: {value: ImageRotation.Rotate90},
    ROTATE_180: {value: ImageRotation.Rotate180},
    ROTATE_270: {value: ImageRotation.Rotate270}
  }
})

export const GraphQLImageOutput = new GraphQLEnumType({
  name: 'ImageOutput',
  values: {
    PNG: {value: ImageOutput.PNG},
    JPEG: {value: ImageOutput.JPEG},
    WEBP: {value: ImageOutput.WEBP}
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

    createdAt: {type: GraphQLDateTime},
    updatedAt: {type: GraphQLDateTime},

    filename: {type: GraphQLNonNull(GraphQLString)},
    fileSize: {type: GraphQLNonNull(GraphQLInt)},
    extension: {type: GraphQLNonNull(GraphQLString)},
    mimeType: {type: GraphQLNonNull(GraphQLString)},
    format: {type: GraphQLNonNull(GraphQLString)},
    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    width: {type: GraphQLNonNull(GraphQLInt)},
    height: {type: GraphQLNonNull(GraphQLInt)},
    focalPoint: {type: GraphQLPoint},
    url: {
      type: GraphQLNonNull(GraphQLString),
      resolve(image, {}, {mediaAdapter}) {
        return mediaAdapter.getImageURL(image)
      }
    },
    transform: {
      type: GraphQLNonNull(GraphQLList(GraphQLString)),
      args: {transformations: {type: GraphQLList(GraphQLImageTransformation)}}, // TODO: Consider renaming transformations to input
      resolve(image, {transformations}, {mediaAdapter}) {
        return Promise.all(
          transformations.map((transformation: any) =>
            mediaAdapter.getImageURL(image, transformation)
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
    totalCount: {type: GraphQLNonNull(GraphQLInt)},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)}
  }
})
