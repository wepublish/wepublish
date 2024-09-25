import {ApiV1, Blocks, BuilderBlocksProps, isRichTextBlock} from '@wepublish/website'
import {allPass, complement, findIndex, insert} from 'ramda'
import {useMemo} from 'react'

import {isContentBoxBlock} from './mannschaft-content-box'

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
      allPass([isRichTextBlock, complement(isContentBoxBlock)])
    )

    let blocksWithAds = blocks

    // We only want to show an ad if there's more than 3 richtext blocks,
    // as there's already an ad at the end of the article
    if (richtextBlocks.length > 3) {
      blocksWithAds = insert(
        // insert an ad **after** the 3rd richtext block
        findIndex(block => block === richtextBlocks[2])(blocks) + 1,
        createNewAdTeaser(),
        blocks
      )
    }

    // We only want to show an ad if there's more than 6 richtext blocks,
    // as there's already an ad at the end of the article
    if (richtextBlocks.length > 6) {
      blocksWithAds = insert(
        // insert an ad **after** the 6th richtext block
        findIndex(block => block === richtextBlocks[5])(blocks) + 1,
        createNewAdTeaser(),
        blocks
      )
    }

    return blocksWithAds
  }, [blocks, type])

  return <Blocks blocks={newBlocks} type={type} />
}
