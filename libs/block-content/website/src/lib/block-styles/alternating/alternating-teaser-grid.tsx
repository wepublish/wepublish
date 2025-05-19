import {BuilderTeaserGridBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const AlternatingTeaserGridBlock = (props: BuilderTeaserGridBlockProps) => {
  const {
    blocks: {TeaserGrid}
  } = useWebsiteBuilder()

  return <TeaserGrid {...props} numColumns={1} />
}
