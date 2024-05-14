import {FullImageFragment} from '@wepublish/website/api'
import {ImgHTMLAttributes} from 'react'

export type BuilderImageProviderProps = {
  square?: boolean
} & Pick<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'fetchPriority'>

export type BuilderImageProps = {
  image: FullImageFragment
} & BuilderImageProviderProps &
  Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'alt' | 'title' | 'width' | 'height'>
