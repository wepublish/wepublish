import {ContentModel, ContentModelSchemaTypes} from '@wepublish/api'

export const contentModelSimpleExample: ContentModel = {
  identifier: 'simple',
  nameSingular: 'Simple',
  namePlural: 'Simple',
  schema: {
    content: {
      myString: {
        type: ContentModelSchemaTypes.string
      },
      myRichText: {
        type: ContentModelSchemaTypes.richText
      }
    }
  }
}
