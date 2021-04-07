import {ContentModel, ContentModelSchemaTypes} from '@wepublish/api'

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
