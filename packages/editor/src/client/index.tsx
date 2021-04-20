import {initClient} from './client'
import {ExtensionConfig} from './interfaces/extensionConfig'

import 'rsuite/lib/styles/index.less'
import './global.less'
import './atoms/emojiPicker.less'
import './atoms/toolbar.less'
import './blocks/richTextBlock/toolbar/tableMenu.less'

const config: ExtensionConfig = {}
if (document.readyState !== 'loading') {
  initClient(config)
} else {
  document.addEventListener('DOMContentLoaded', () => {
    initClient(config)
  })
}
