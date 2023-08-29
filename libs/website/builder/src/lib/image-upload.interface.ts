import {FullImageFragment} from '@wepublish/website/api'
import {ImgHTMLAttributes} from 'react'

export type BuilderImageUploadProps = {image: FullImageFragment; onUpload: () => void} & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'alt' | 'title' | 'width' | 'height'
>
