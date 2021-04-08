import {initClient} from '@wepublish/editor'
import {config} from './config/config'

import 'rsuite/lib/styles/index.less'
import '@wepublish/editor/src/client/global.less'
import '@wepublish/editor/src/client/atoms/emojiPicker.less'
import '@wepublish/editor/src/client/atoms/toolbar.less'
import '@wepublish/editor/src/client/blocks/richTextBlock/toolbar/tableMenu.less'

if (document.readyState !== 'loading') {
  initClient(config)
} else {
  document.addEventListener('DOMContentLoaded', () => {
    initClient(config)
  })
}
