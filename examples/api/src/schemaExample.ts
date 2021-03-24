import {ContentModel, ContentModelSchemaTypes, ReferenceScope} from '@wepublish/api'

export const contentModelExample: ContentModel = {
  identifier: 'example',
  nameSingular: 'Example',
  namePlural: 'Examples',
  schema: {
    content: {
      myString: {
        type: ContentModelSchemaTypes.string
      },
      myI18nString: {
        type: ContentModelSchemaTypes.string,
        i18n: true
      },
      myRichText: {
        type: ContentModelSchemaTypes.richText
      },
      myI18nRichText: {
        type: ContentModelSchemaTypes.richText,
        i18n: true
      },
      myBoolean: {
        type: ContentModelSchemaTypes.boolean
      },
      myI18nBoolean: {
        type: ContentModelSchemaTypes.boolean,
        i18n: true
      },
      myInt: {
        type: ContentModelSchemaTypes.int
      },
      myI18nInt: {
        type: ContentModelSchemaTypes.int,
        i18n: true
      },
      myFloat: {
        type: ContentModelSchemaTypes.float
      },
      myI18nFloat: {
        type: ContentModelSchemaTypes.float,
        i18n: true
      },
      myDateTime: {
        type: ContentModelSchemaTypes.dateTime
      },
      myI18nDateTime: {
        type: ContentModelSchemaTypes.dateTime,
        i18n: true
      },
      myId: {
        type: ContentModelSchemaTypes.id
      },
      myI18nId: {
        type: ContentModelSchemaTypes.id,
        i18n: true
      },
      myEnum: {
        type: ContentModelSchemaTypes.enum,
        values: [
          {description: 'Foo', value: 'foo'},
          {description: 'Bar', value: 'bar'}
        ]
      },
      myI18nEnum: {
        type: ContentModelSchemaTypes.enum,
        values: [
          {description: 'Foo', value: 'foo'},
          {description: 'Bar', value: 'bar'}
        ],
        i18n: true
      },
      myList: {
        type: ContentModelSchemaTypes.list,
        contentType: {
          type: ContentModelSchemaTypes.string
        }
      },
      myObject: {
        type: ContentModelSchemaTypes.object,
        fields: {
          fieldA: {
            type: ContentModelSchemaTypes.string
          },
          fieldB: {
            type: ContentModelSchemaTypes.int
          }
        }
      },
      myUnion: {
        type: ContentModelSchemaTypes.union,
        cases: {
          caseA: {
            type: ContentModelSchemaTypes.object,
            fields: {
              fieldA: {
                type: ContentModelSchemaTypes.string
              },
              fieldB: {
                type: ContentModelSchemaTypes.int
              }
            }
          },
          caseB: {
            type: ContentModelSchemaTypes.object,
            fields: {
              fieldA: {
                type: ContentModelSchemaTypes.int
              },
              fieldB: {
                type: ContentModelSchemaTypes.string
              }
            }
          }
        }
      },
      myReference: {
        type: ContentModelSchemaTypes.reference,
        types: [
          {
            identifier: 'example',
            scope: ReferenceScope.local
          }
        ]
      }
    }
  }
}
