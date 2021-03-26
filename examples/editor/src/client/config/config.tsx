import React from 'react'
import {ExtensionConfig} from '@wepublish/editor'
import {CustomViewExample} from './customView'
import {CustomContentExample} from './contentExample'
import {BlockType} from './article/articleInterfaces'
import {getContentView} from './article/articleContentView'

export const config: ExtensionConfig = {
  contentModelExtension: [
    {
      identifier: 'simple',
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
        ]
      },
      getContentView: (content: any, handleChange: any, disabled: boolean) => {
        return <CustomContentExample value={content} onChange={handleChange} />
      }
    },
    {
      identifier: 'article',
      defaultContent: {blocks: [{key: '0', type: BlockType.Title, value: {title: '', lead: ''}}]},
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
