import {ContentModel, ContentModelSchemaTypes, MediaReferenceType} from '@wepublish/api'

export const contentModelA: ContentModel = {
  identifier: 'modelA',
  nameSingular: 'Model A',
  namePlural: 'Models A',
  schema: {
    content: {
      myString: {
        type: ContentModelSchemaTypes.string
      },
      myStringI18n: {
        type: ContentModelSchemaTypes.string,
        i18n: true
      },
      myRichText: {
        type: ContentModelSchemaTypes.richText
      },
      myRef: {
        type: ContentModelSchemaTypes.reference,
        types: {
          modelA: {
            scope: 'local'
          },
          modelB: {
            scope: 'local'
          },
          [MediaReferenceType]: {
            scope: 'local'
          }
        }
      }
    }
  }
}

export const contentModelB: ContentModel = {
  identifier: 'modelB',
  nameSingular: 'Model B',
  namePlural: 'Models B',
  schema: {
    content: {
      myString: {
        type: ContentModelSchemaTypes.string
      },
      myRichText: {
        type: ContentModelSchemaTypes.richText
      },
      myRef: {
        type: ContentModelSchemaTypes.reference,
        types: {
          modelA: {
            scope: 'local'
          }
        }
      }
    }
  }
}
