import {ContentModel, ContentModelSchemaTypes, ReferenceScope} from '@wepublish/api'

export const contentModelA: ContentModel = {
  identifier: 'modelA',
  nameSingular: 'Model A',
  namePlural: 'Models A',
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
            identifier: 'modelA',
            scope: ReferenceScope.local
          },
          {
            identifier: 'modelB',
            scope: ReferenceScope.local
          }
        ]
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
        types: [
          {
            identifier: 'modelA',
            scope: ReferenceScope.local
          }
        ]
      }
    }
  }
}
