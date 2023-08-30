import {ChangeEvent, ImgHTMLAttributes} from 'react'

export type BuilderImageUploadProps = {
  image?: {url?: string | null | undefined}
  onUpload: (image: ChangeEvent<HTMLInputElement> | null) => void
} & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'alt' | 'title' | 'width' | 'height'
>
