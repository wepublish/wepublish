import {ApiV1, Blocks, BuilderBlocksProps, hasBlockStyle, isRichTextBlock} from '@wepublish/website'
import {allPass, complement, findIndex, insert} from 'ramda'
import {useMemo} from 'react'

export const createNewAdTeaser = (): ApiV1.TeaserGridBlock => ({
  __typename: 'TeaserGridBlock',
  numColumns: 1,
  teasers: [
    {
      __typename: 'CustomTeaser',
      properties: [],
      contentUrl: null,
      preTitle: 'ad-300x250',
      title: null,
      lead: null,
      image: null,
      style: ApiV1.TeaserStyle.Default
    } as ApiV1.CustomTeaser
  ]
})

export const MannschaftBlocks = ({blocks, type}: BuilderBlocksProps) => {
  const newBlocks = useMemo(() => {
    if (type === 'Page') {
      return blocks
    }

    const richtextBlocks = blocks.filter(
      // We ignore content boxes here as we do not want to break them apart
      allPass([isRichTextBlock, complement(hasBlockStyle('ContentBox'))])
    )

    let blocksWithAds = blocks

    if (richtextBlocks.length > 3) {
      blocksWithAds = insert(
        findIndex(block => block === richtextBlocks[2])(blocks) + 1,
        createNewAdTeaser(),
        blocks
      )
    }

    if (richtextBlocks.length > 6) {
      blocksWithAds = insert(
        findIndex(block => block === richtextBlocks[5])(blocks) + 1,
        createNewAdTeaser(),
        blocks
      )
    }

    return blocksWithAds
  }, [blocks, type])

  return <Blocks blocks={newBlocks} type={type} />
}
