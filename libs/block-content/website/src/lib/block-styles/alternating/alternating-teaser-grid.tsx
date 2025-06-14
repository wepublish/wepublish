import {BuilderBlockStyleProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const AlternatingTeaserGridBlock = (
  props: BuilderBlockStyleProps['AlternatingTeaserGrid']
) => {
  const {
    blocks: {TeaserGrid}
  } = useWebsiteBuilder()

  return <TeaserGrid {...props} numColumns={1} />
}
