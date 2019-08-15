import {hot} from 'react-hot-loader/root'
import {hydrateClient} from '@wepublish/react/client'
import {App} from '../common'

hydrateClient({
  appComponent: hot(App)
})
