import styled from '@emotion/styled'
import {Paywall} from '@wepublish/paywall/website'

export const HauptstadtPaywall = styled(Paywall)`
  background-color: ${({theme}) => theme.palette.primary.main};
  color: ${({theme}) => theme.palette.primary.contrastText};
`
