import {
  ContentModel,
  ContentModelSchemaFieldObject,
  ContentModelSchemaTypes,
  ReferenceScope
} from '@wepublish/api'

const title: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  fields: {
    title: {
      type: ContentModelSchemaTypes.string
    },
    lead: {
      type: ContentModelSchemaTypes.string
    }
  }
}

const richText: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  fields: {
    richText: {
      type: ContentModelSchemaTypes.richText
    }
  }
}

const image: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  fields: {
    image: {
      type: ContentModelSchemaTypes.reference,
      types: [
        {
          identifier: '__media',
          scope: ReferenceScope.local
        }
      ]
    },
    caption: {
      type: ContentModelSchemaTypes.string
    }
  }
}

const blockListicleItem: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  fields: {
    title: {
      type: ContentModelSchemaTypes.string
    },
    richText: {
      type: ContentModelSchemaTypes.richText
    },
    image: {
      type: ContentModelSchemaTypes.reference,
      types: [
        {
          identifier: '',
          scope: ReferenceScope.local
        }
      ]
    }
  }
}

const listicle: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    items: {
      type: ContentModelSchemaTypes.list,
      required: true,
      contentType: blockListicleItem
    }
  }
}

const vimeo: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    videoID: {
      type: ContentModelSchemaTypes.string
    }
  }
}

const youtube: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    videoID: {
      type: ContentModelSchemaTypes.string
    }
  }
}

const blockGalleryImageEdge: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    image: {
      type: ContentModelSchemaTypes.reference,
      types: [
        {
          identifier: '',
          scope: ReferenceScope.local
        }
      ]
    },
    caption: {
      type: ContentModelSchemaTypes.string
    }
  }
}

const galleryImage: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    images: {
      type: ContentModelSchemaTypes.list,
      required: true,
      contentType: blockGalleryImageEdge
    }
  }
}

export const contentModelArticle: ContentModel = {
  identifier: 'article',
  nameSingular: 'Article',
  namePlural: 'Articles',
  schema: {
    content: {
      blocks: {
        type: ContentModelSchemaTypes.list,
        contentType: {
          type: ContentModelSchemaTypes.union,
          cases: {
            title,
            richText,
            image,
            listicle,
            vimeo,
            youtube,
            galleryImage
          }
        }
      }
    }
  }
}
