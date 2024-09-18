import {ApiV1, Blocks, BuilderBlocksProps} from '@wepublish/website'
import {insert} from 'ramda'
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

    let blocksWithAds = blocks

    if (blocks.length > 3) {
      blocksWithAds = insert(2, createNewAdTeaser(), blocks)
    }

    if (blocks.length > 6) {
      blocksWithAds = insert(5, createNewAdTeaser(), blocks)
    }

    return blocksWithAds
  }, [blocks, type])

  return <Blocks blocks={newBlocks} type={type} />
}
