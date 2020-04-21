import 'core-js/stable' // TODO: Import only required
import 'regenerator-runtime/runtime'

import {hydrateApp} from './hydrate'

async function asyncMain() {
  await hydrateApp()
}

asyncMain().catch(err => {
  console.error(err)
})
