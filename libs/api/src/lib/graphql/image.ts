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

import {GraphQLDateTime} from 'graphql-scalars'
import {GraphQLUpload} from 'graphql-upload'

import {Context} from '../context'
import {ImageSort, ImageWithTransformURL} from '../db/image'
import {ImageRotation, ImageOutput} from '@wepublish/image/api'
import {GraphQLPageInfo} from './common'
import {createProxyingResolver} from '../utility'

export const GraphQLInputPoint = new GraphQLInputObjectType({
  name: 'InputPoint',
  fields: {
    x: {type: new GraphQLNonNull(GraphQLFloat)},
    y: {type: new GraphQLNonNull(GraphQLFloat)}
  }
})

export const GraphQLPoint = new GraphQLObjectType<any, Context>({
  name: 'Point',
  fields: {
    x: {type: new GraphQLNonNull(GraphQLFloat)},
    y: {type: new GraphQLNonNull(GraphQLFloat)}
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
    // @ts-expect-error graphql-upload has outdated typings
    file: {type: new GraphQLNonNull(GraphQLUpload)},
    filename: {type: GraphQLString},

    title: {type: GraphQLString},
    description: {type: GraphQLString},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},

    link: {type: GraphQLString},
    source: {type: GraphQLString},
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
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},

    link: {type: GraphQLString},
    source: {type: GraphQLString},
    license: {type: GraphQLString},

    focalPoint: {type: GraphQLInputPoint}
  }
})

export const GraphQLImageFilter = new GraphQLInputObjectType({
  name: 'ImageFilter',
  fields: {
    title: {type: GraphQLString},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLImageSort = new GraphQLEnumType({
  name: 'ImageSort',
  values: {
    CREATED_AT: {value: ImageSort.CreatedAt},
    MODIFIED_AT: {value: ImageSort.ModifiedAt}
  }
})

export const GraphQLImage = new GraphQLObjectType<ImageWithTransformURL, Context>({
  name: 'Image',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    filename: {type: GraphQLString},
    title: {type: GraphQLString},
    description: {type: GraphQLString},
    tags: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString)))},

    link: {type: GraphQLString},
    source: {type: GraphQLString},
    license: {type: GraphQLString},

    fileSize: {type: new GraphQLNonNull(GraphQLInt)},
    extension: {type: new GraphQLNonNull(GraphQLString)},
    mimeType: {type: new GraphQLNonNull(GraphQLString)},
    format: {type: new GraphQLNonNull(GraphQLString)},
    width: {type: new GraphQLNonNull(GraphQLInt)},
    height: {type: new GraphQLNonNull(GraphQLInt)},
    focalPoint: {type: GraphQLPoint},

    url: {
      type: GraphQLString,
      resolve: createProxyingResolver((image, _, {mediaAdapter}) => {
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
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLImage)))},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)}
  }
})
