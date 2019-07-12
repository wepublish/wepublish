import {lazy} from '@wepublish/core'
export const LazyTestComponent = lazy('./component', async () => import('./component'))
