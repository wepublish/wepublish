import {ImgHTMLAttributes} from 'react'

export type BuilderImageUploadProps = {image: {url: string}; onUpload: () => void} & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'alt' | 'title' | 'width' | 'height'
>
