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
      myRichTextI18n: {
        type: ContentModelSchemaTypes.richText,
        i18n: true
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
    },
    meta: {
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
      myRichTextI18n: {
        type: ContentModelSchemaTypes.richText,
        i18n: true
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
