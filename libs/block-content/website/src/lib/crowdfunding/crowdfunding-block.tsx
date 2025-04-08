import {BlockContent, CrowdfundingBlock as CrowdfundingBlockType} from '@wepublish/website/api'
import {BuilderCrowdfundingBlockProps} from '@wepublish/website/builder'

export const isCrowdfundingBlock = (
  block: Pick<BlockContent, '__typename'>
): block is CrowdfundingBlockType => block.__typename === 'CrowdfundingBlock'

export const CrowdfundingBlock = ({crowdfunding}: BuilderCrowdfundingBlockProps) => {
  return (
    <>
      <h1>{crowdfunding?.name}</h1>
    </>
  )
}
