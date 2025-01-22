import styled from '@emotion/styled'
import {Subscribe} from '@wepublish/website'

export const KolumnaSubscribe = styled(Subscribe)`
  .MuiSlider-root {
    color: ${({theme}) => theme.palette.primary.main};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    .MuiButton-root {
      font-size: 1.15em;
      padding: 0.75em 2em;
    }
  }
`
