import {BuilderImageProps} from './image.interface'
import {useWebsiteBuilder} from './website-builder.context'

export const Image = (props: BuilderImageProps) => {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  return <Image {...props} />
}
