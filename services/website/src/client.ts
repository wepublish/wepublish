import {Client} from '@wepublish/website/client'

new Client({}).hydrate().then(() => {
  console.log('Hydrated client!')
})
