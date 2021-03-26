import {initClient} from '@wepublish/editor'
import {config} from './config/config'

if (document.readyState !== 'loading') {
  initClient(config)
} else {
  document.addEventListener('DOMContentLoaded', () => {
    initClient(config)
  })
}
