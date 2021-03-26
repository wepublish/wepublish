import React from 'react'
import {ExtensionConfig} from '@wepublish/editor'
import {CustomViewExample} from './customView'
import {CustomContentExample} from './contentExample'

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
