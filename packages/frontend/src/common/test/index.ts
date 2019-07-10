import {lazy} from '../lazy'

export const LazyTestComponent2 = lazy('./component', () => import('./component'))
