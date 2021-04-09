import React from 'react'
import {ExtensionConfig} from '@wepublish/editor'
import {CustomViewExample} from './customView'
import {ContentA_EditView} from './contentA'
import {ContentB_EditView} from './contentB'
import {BlockType} from './article/articleInterfaces'
import {getContentView} from './article/articleContentView'
import {ContentMetadataPanel} from './contentAMetadata'

export const config: ExtensionConfig = {
  contentModelExtension: [
    {
      identifier: 'modelA',
      defaultContent: {
        myString: '',
        myStringI18n: {
          de: '',
          en: ''
        },
        myRichText: [
          {
            type: 'paragraph',
            children: [
              {
                text: ''
              }
            ]
          }
        ],
        myRichTextI18n: {
          de: [
            {
              type: 'paragraph',
              children: [
                {
                  text: ''
                }
              ]
            }
          ],
          en: [
            {
              type: 'paragraph',
              children: [
                {
                  text: ''
                }
              ]
            }
          ]
        },
        myRef: null
      },
      defaultMeta: {
        myString: '',
        myStringI18n: {
          de: '',
          en: ''
        },
        myRichText: [
          {
            type: 'paragraph',
            children: [
              {
                text: ''
              }
            ]
          }
        ],
        myRichTextI18n: {
          de: [
            {
              type: 'paragraph',
              children: [
                {
                  text: ''
                }
              ]
            }
          ],
          en: [
            {
              type: 'paragraph',
              children: [
                {
                  text: ''
                }
              ]
            }
          ]
        },
        myRef: null
      },
      getContentView: (content, onChange, disabled) => {
        return <ContentA_EditView value={content} onChange={onChange} />
      },
      getMetaView: (metadata, customMetadata, onChange, onChangeMetadata) => {
        return (
          <ContentMetadataPanel
            defaultMetadata={metadata}
            customMetadata={customMetadata}
            onChangeDefaultMetadata={onChange}
            onChangeCustomMetadata={onChangeMetadata}
          />
        )
      }
    },
    {
      identifier: 'modelB',
      defaultContent: {
        myString: '',
        myRichText: [
          {
            type: 'paragraph',
            children: [
              {
                text: ''
              }
            ]
          }
        ],
        myRef: null
      },
      getContentView: (content: any, handleChange: any, disabled: boolean) => {
        return <ContentB_EditView value={content} onChange={handleChange} />
      }
    },
    {
      identifier: 'article',
      defaultContent: {blocks: [{[BlockType.Title]: {title: '', lead: ''}}]},
      getContentView: getContentView
    }
  ],
  cusomExtension: [
    {
      identifier: 'customView',
      nameSingular: 'Custom View',
      namePlural: 'Custom View',
      view: <CustomViewExample />
    }
  ]
}
