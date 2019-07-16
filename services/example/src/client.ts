import {Client} from '@wepublish/react/client'

new Client({}).hydrate().then(() => {
  console.log('Hydrated client!')
})
