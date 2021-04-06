import React from 'react'
import {useRoute} from '../route'
import {EditorConfig, CusomExtension} from '../interfaces/extensionConfig'

export interface ArticleEditorProps {
  readonly configs: EditorConfig
}

export function Extension({configs}: ArticleEditorProps) {
  const {current} = useRoute()
  const type = (current?.params as any).type || ''

  const cusomContentConfig = configs.cusomExtension?.find(config => {
    return config.identifier === type
  }) as CusomExtension | undefined
  if (!cusomContentConfig) {
    throw Error(`Content type ${type} not supported`)
  }

  return <>{cusomContentConfig.view}</>
}
