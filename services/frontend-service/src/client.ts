import {Client} from '@wepublish/frontend/client'

new Client({}).hydrate().then(() => {
  console.log('Hydrated client!')
})
