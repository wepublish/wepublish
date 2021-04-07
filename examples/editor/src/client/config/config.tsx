import React from 'react'
import {ExtensionConfig} from '@wepublish/editor'
import {CustomViewExample} from './customView'
import {ContentA_EditView} from './contentA'
import {ContentB_EditView} from './contentB'
import {BlockType} from './article/articleInterfaces'
import {getContentView} from './article/articleContentView'

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
        myRef: null
      },
      getContentView: (content: any, handleChange: any, disabled: boolean) => {
        return <ContentA_EditView value={content} onChange={handleChange} />
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
