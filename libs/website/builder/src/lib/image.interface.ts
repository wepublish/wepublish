import {FullImageFragment} from '@wepublish/website/api'
import {ImgHTMLAttributes} from 'react'

export type BuilderImageProps = {image: FullImageFragment; square?: boolean} & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'alt' | 'title' | 'width' | 'height'
>
