import {lazy} from './lazy'
export const LazyTestComponent = lazy('./component', async () => import('./component'))
