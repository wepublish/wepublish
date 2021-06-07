import {getToggleElementOnKeyDown} from '@udecode/slate-plugins-common'
import {getRenderElement, SlatePlugin} from '@udecode/slate-plugins-core'
import {ELEMENT_QUOTATION_MARKS} from './defaults'
import {getBlockquoteDeserialize as getQuotationMarksDeserialize} from './getBlockquoteDeserialize'

/**
 * Enables support for block quotes, useful for
 * quotations and passages.
 */
export const createQuotationMarksPlugin = (): SlatePlugin => ({
  pluginKeys: ELEMENT_QUOTATION_MARKS,
  renderElement: getRenderElement(ELEMENT_QUOTATION_MARKS),
  deserialize: getQuotationMarksDeserialize(),
  onKeyDown: getToggleElementOnKeyDown(ELEMENT_QUOTATION_MARKS)
})
