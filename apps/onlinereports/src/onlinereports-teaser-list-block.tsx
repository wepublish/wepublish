import {
  alignmentForTeaserBlock,
  BuilderTeaserListBlockProps,
  useWebsiteBuilder
} from '@wepublish/website'

export const OnlineReportsTeaserListBlock = ({
  title,
  teasers,
  blockStyle,
  className
}: BuilderTeaserListBlockProps) => {
  const {
    elements: {H5},
    blocks: {Teaser}
  } = useWebsiteBuilder()

  return (
    <>
      {teasers.map((teaser, index) => (
        <Teaser
          key={index}
          teaser={teaser}
          alignment={alignmentForTeaserBlock(index, 3)}
          blockStyle={blockStyle}
        />
      ))}
    </>
  )
}
