import {getElementDeserializer} from '@udecode/slate-plugins-common'
import {Deserialize, getSlatePluginOptions} from '@udecode/slate-plugins-core'
import {ELEMENT_QUOTATION_MARKS} from './defaults'

export const getBlockquoteDeserialize = (): Deserialize => editor => {
  const options = getSlatePluginOptions(editor, ELEMENT_QUOTATION_MARKS)

  return {
    element: getElementDeserializer({
      type: options.type,
      rules: [{nodeNames: 'QUOTATION_MARKS'}],
      ...options.deserialize
    })
  }
}
