import {hot} from 'react-hot-loader/root'
import {Client} from '@wepublish/react/client'
import {App} from '../common'

new Client({
  appComponent: hot(App)
})
  .hydrate()
  .then(() => {
    console.log('Hydrated client!')
  })
