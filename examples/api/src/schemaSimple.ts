import {ContentModel, ContentModelSchemaTypes, ReferenceScope} from '@wepublish/api'

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
      },
      myRef: {
        type: ContentModelSchemaTypes.reference,
        types: [
          {
            identifier: 'article',
            scope: ReferenceScope.local
          }
          // {
          //   identifier: 'simple',
          //   scope: ReferenceScope.local
          // }
        ]
      }
    }
  }
}
