import {styled} from '@mui/material'
import {BildwurfAdBlock as BildwurfAdBlockType, Block} from '@wepublish/website/api'
import {BuilderBildwurfAdBlockProps} from '@wepublish/website/builder'
import {useId} from 'react'

export const isBildwurfAdBlock = (block: Block): block is BildwurfAdBlockType =>
  block.__typename === 'BildwurfAdBlock'

export const BildwurfBlockWrapper = styled('div')``

export function BildwurfAdBlock({zoneID, className}: BuilderBildwurfAdBlockProps) {
  const id = useId()

  return (
    <BildwurfBlockWrapper className={className} id={id}>
      <ins className="aso-zone" data-zone={zoneID}></ins>
    </BildwurfBlockWrapper>
  )
}
