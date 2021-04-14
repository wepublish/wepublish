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
      myInt: {
        type: ContentModelSchemaTypes.int
      },
      myFloat: {
        type: ContentModelSchemaTypes.float
      },
      myBoolean: {
        type: ContentModelSchemaTypes.boolean
      },
      myEnum: {
        type: ContentModelSchemaTypes.enum,
        values: [
          {
            value: 'foo',
            description: 'Foo'
          },
          {
            value: 'bar',
            description: 'Bar'
          }
        ]
      },
      myList: {
        type: ContentModelSchemaTypes.list,
        contentType: {
          type: ContentModelSchemaTypes.string
        }
      },
      myUnion: {
        type: ContentModelSchemaTypes.union,
        cases: {
          caseA: {
            type: ContentModelSchemaTypes.object,
            fields: {
              foo: {
                type: ContentModelSchemaTypes.boolean
              }
            }
          },
          caseB: {
            type: ContentModelSchemaTypes.object,
            fields: {
              bar: {
                type: ContentModelSchemaTypes.float
              }
            }
          }
        }
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
