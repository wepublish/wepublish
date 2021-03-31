import {
  ContentModel,
  ContentModelSchemaFieldEnum,
  ContentModelSchemaFieldObject,
  ContentModelSchemaTypes,
  MediaReferenceType
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
      type: ContentModelSchemaTypes.richText,
      required: true
    }
  }
}

const image: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  fields: {
    image: {
      type: ContentModelSchemaTypes.reference,
      types: {
        [MediaReferenceType]: {
          scope: 'local'
        }
      },
      required: true
    },
    caption: {
      type: ContentModelSchemaTypes.string
    }
  }
}

const imageGallery: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  fields: {
    images: {
      type: ContentModelSchemaTypes.list,
      contentType: image,
      required: true
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
      types: {
        [MediaReferenceType]: {
          scope: 'local'
        }
      }
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
      type: ContentModelSchemaTypes.id,
      required: true
    }
  }
}

const youtube: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    videoID: {
      type: ContentModelSchemaTypes.id,
      required: true
    }
  }
}

const soundCloudTrack: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    trackID: {
      type: ContentModelSchemaTypes.id,
      required: true
    }
  }
}

const embed: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    url: {
      type: ContentModelSchemaTypes.string
    },
    title: {
      type: ContentModelSchemaTypes.string
    },
    width: {
      type: ContentModelSchemaTypes.int
    },
    height: {
      type: ContentModelSchemaTypes.int
    },
    styleCustom: {
      type: ContentModelSchemaTypes.string
    }
  }
}

const linkPageBreak: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    text: {
      type: ContentModelSchemaTypes.string
    },
    richText: {
      type: ContentModelSchemaTypes.richText,
      required: true
    },
    linkURL: {
      type: ContentModelSchemaTypes.string
    },
    linkText: {
      type: ContentModelSchemaTypes.string
    },
    linkTarget: {
      type: ContentModelSchemaTypes.string
    },
    hideButton: {
      type: ContentModelSchemaTypes.boolean,
      required: true
    },
    styleOption: {
      type: ContentModelSchemaTypes.string
    },
    layoutOption: {
      type: ContentModelSchemaTypes.string
    },
    templateOption: {
      type: ContentModelSchemaTypes.string
    },
    image: {
      type: ContentModelSchemaTypes.reference,
      types: {
        [MediaReferenceType]: {
          scope: 'local'
        }
      }
    }
  }
}

const quote: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    quote: {
      type: ContentModelSchemaTypes.string
    },
    author: {
      type: ContentModelSchemaTypes.string
    }
  }
}

const teaserStyle: ContentModelSchemaFieldEnum = {
  type: ContentModelSchemaTypes.enum,
  values: [
    {description: 'default', value: 'DEFAULT'},
    {description: 'light', value: 'LIGHT'},
    {description: 'text', value: 'TEXT'}
  ]
}

const teaserGrid: ContentModelSchemaFieldObject = {
  type: ContentModelSchemaTypes.object,
  required: true,
  fields: {
    teasers: {
      type: ContentModelSchemaTypes.list,
      required: true,
      contentType: {
        type: ContentModelSchemaTypes.object,
        fields: {
          style: teaserStyle,
          imageID: {
            type: ContentModelSchemaTypes.reference,
            types: {
              [MediaReferenceType]: {
                scope: 'local'
              }
            }
          },
          preTitle: {type: ContentModelSchemaTypes.string},
          title: {type: ContentModelSchemaTypes.string},
          lead: {type: ContentModelSchemaTypes.string},
          contentRef: {
            type: ContentModelSchemaTypes.reference,
            types: {
              article: {
                scope: 'all'
              },
              page: {
                scope: 'local'
              }
            }
          }
        }
      }
    },
    numColumns: {
      type: ContentModelSchemaTypes.int,
      required: true
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
            imageGallery,
            listicle,
            vimeo,
            youtube,
            soundCloudTrack,
            embed,
            linkPageBreak,
            quote,
            teaserGrid
          }
        }
      }
    }
  }
}
