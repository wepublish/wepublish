import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLID
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'

import {Context} from '../context'
import {Image, ImageRotation, ImageOutput} from '../adapter/image'
import {GraphQLPageInfo} from './pageInfo'
import {GraphQLUpload} from 'graphql-upload'

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

export const GraphQLUploadImageInput = new GraphQLInputObjectType({
  name: 'UploadImageInput',
  fields: {
    file: {type: GraphQLNonNull(GraphQLUpload)},
    filename: {type: GraphQLString},

    title: {type: GraphQLString},
    description: {type: GraphQLString},
    source: {type: GraphQLString},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))},

    focalPoint: {type: GraphQLInputPoint}
  }
})

export const GraphQLUpdateImageInput = new GraphQLInputObjectType({
  name: 'UpdateImageInput',
  fields: {
    filename: {type: GraphQLString},

    title: {type: GraphQLString},
    description: {type: GraphQLString},
    source: {type: GraphQLString},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))},

    focalPoint: {type: GraphQLInputPoint}
  }
})

export const GraphQLImage = new GraphQLObjectType<Image, Context>({
  name: 'Image',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    archivedAt: {type: GraphQLDateTime},

    isArchived: {type: GraphQLNonNull(GraphQLBoolean)},

    filename: {type: GraphQLNonNull(GraphQLString)},
    fileSize: {type: GraphQLNonNull(GraphQLInt)},
    extension: {type: GraphQLNonNull(GraphQLString)},
    mimeType: {type: GraphQLNonNull(GraphQLString)},
    format: {type: GraphQLNonNull(GraphQLString)},

    title: {type: GraphQLString},
    description: {type: GraphQLString},
    source: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    width: {type: GraphQLNonNull(GraphQLInt)},
    height: {type: GraphQLNonNull(GraphQLInt)},
    focalPoint: {type: GraphQLPoint},

    url: {
      type: GraphQLString,
      resolve(image, {}, {mediaAdapter}) {
        return mediaAdapter.getImageURL(image)
      }
    },

    transform: {
      type: GraphQLList(GraphQLString),
      args: {input: {type: GraphQLList(GraphQLImageTransformation)}},
      resolve(image, {input}, {mediaAdapter}) {
        return Promise.all(
          input.map((transformation: any) => mediaAdapter.getImageURL(image, transformation))
        )
      }
    }
  }
})

export const GraphQLImageConnection = new GraphQLObjectType<any, Context>({
  name: 'ImageConnection',
  fields: {
    nodes: {type: GraphQLList(GraphQLImage)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)}
  }
})
