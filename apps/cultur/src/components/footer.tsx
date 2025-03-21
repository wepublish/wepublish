import styled from '@emotion/styled'
import {
  Footer as WepFooter,
  FooterInnerWrapper,
  FooterPaperWrapper
} from '@wepublish/navigation/website'

export const Footer = styled(WepFooter)`
  background-color: transparent;
  color: ${({theme}) => theme.palette.text.primary};

  ${FooterInnerWrapper} {
    justify-items: center;
  }

  ${FooterPaperWrapper} {
    background: ${({theme}) => theme.palette.primary.main};
  }
`
