import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLID
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLUpload} from 'apollo-server-express'

import {Context} from '../context'
import {Image, ImageRotation, ImageOutput, ImageSort} from '../db/image'
import {GraphQLPageInfo} from './common'
import {createProxyingResolver} from '../utility'

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
    file: {type: GraphQLNonNull(GraphQLUpload!)},
    filename: {type: GraphQLString},

    title: {type: GraphQLString},
    description: {type: GraphQLString},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))},

    source: {type: GraphQLString},
    author: {type: GraphQLString},
    license: {type: GraphQLString},

    focalPoint: {type: GraphQLInputPoint}
  }
})

export const GraphQLUpdateImageInput = new GraphQLInputObjectType({
  name: 'UpdateImageInput',
  fields: {
    filename: {type: GraphQLString},

    title: {type: GraphQLString},
    description: {type: GraphQLString},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))},

    source: {type: GraphQLString},
    author: {type: GraphQLString},
    license: {type: GraphQLString},

    focalPoint: {type: GraphQLInputPoint}
  }
})

export const GraphQLImageFilter = new GraphQLInputObjectType({
  name: 'ImageFilter',
  fields: {
    title: {type: GraphQLString},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLImageSort = new GraphQLEnumType({
  name: 'ImageSort',
  values: {
    CREATED_AT: {value: ImageSort.CreatedAt},
    MODIFIED_AT: {value: ImageSort.ModifiedAt}
  }
})

export const GraphQLImage = new GraphQLObjectType<Image, Context>({
  name: 'Image',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    filename: {type: GraphQLString},
    title: {type: GraphQLString},
    description: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    source: {type: GraphQLString},
    author: {type: GraphQLString},
    license: {type: GraphQLString},

    fileSize: {type: GraphQLNonNull(GraphQLInt)},
    extension: {type: GraphQLNonNull(GraphQLString)},
    mimeType: {type: GraphQLNonNull(GraphQLString)},
    format: {type: GraphQLNonNull(GraphQLString)},
    width: {type: GraphQLNonNull(GraphQLInt)},
    height: {type: GraphQLNonNull(GraphQLInt)},
    focalPoint: {type: GraphQLPoint},

    url: {
      type: GraphQLString,
      resolve: createProxyingResolver((image, {}, {mediaAdapter}) => {
        return mediaAdapter.getImageURL(image)
      })
    },

    transformURL: {
      type: GraphQLString,
      args: {input: {type: GraphQLImageTransformation}},
      resolve: createProxyingResolver((image, {input}, {mediaAdapter}) => {
        return image.transformURL ? image.transformURL : mediaAdapter.getImageURL(image, input)
      })
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
