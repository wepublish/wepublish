import styled from '@emotion/styled'
import {Footer as WepFooter, FooterInnerWrapper} from '@wepublish/website'

export const Footer = styled(WepFooter)`
  background-color: transparent;
  color: ${({theme}) => theme.palette.text.primary};

  ${FooterInnerWrapper} {
    justify-items: center;
  }
`
