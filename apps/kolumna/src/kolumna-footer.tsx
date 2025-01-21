import styled from '@emotion/styled'
import {Footer, FooterPaperWrapper} from '@wepublish/website'

export const KolumnaFooter = styled(Footer)`
  ${FooterPaperWrapper} {
    background-color: ${({theme}) => theme.palette.accent.main};
  }
`
