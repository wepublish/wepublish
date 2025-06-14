import {BuilderLinkProps} from './typography.interface'
import {useWebsiteBuilder} from './website-builder.context'

export const Link = (props: BuilderLinkProps) => {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return <Link {...props} />
}
