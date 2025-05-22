import styled from '@emotion/styled'
import {Footer, FooterPaperWrapper} from '@wepublish/navigation/website'

export const HauptstadtFooter = styled(Footer)`
  ${FooterPaperWrapper} {
    background-color: ${({theme}) => theme.palette.secondary.main};
    color: ${({theme}) => theme.palette.secondary.contrastText};
  }
`
