import {BlockContent, CrowdfundingBlock as CrowdfundingBlockType} from '@wepublish/website/api'

export const isCrowdfundingBlock = (
  block: Pick<BlockContent, '__typename'>
): block is CrowdfundingBlockType => block.__typename === 'CrowdfundingBlock'
