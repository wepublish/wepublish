import {styled} from '@mui/material'
import {ContextBox, ContextBoxIcon, ContextBoxTitle} from '@wepublish/website'

export const TsriContextBox = styled(ContextBox)`
  ${ContextBoxIcon} {
    display: none;
  }

  ${ContextBoxTitle} {
    grid-column: 2/3;
  }
`
