import styled from '@emotion/styled'
import {BreakBlock, HeadingWithImage, HeadingWithoutImage} from '@wepublish/block-content/website'

export const TsriBreakBlock = styled(BreakBlock)`
  background-color: ${({theme}) => theme.palette.accent.main};
  margin-top: ${({theme}) => theme.spacing(5)};
  margin-bottom: ${({theme}) => theme.spacing(5)};

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: ${({theme}) => theme.spacing(10)};
  }

  ${HeadingWithoutImage}, ${HeadingWithImage} {
    font-size: 2rem;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    ${HeadingWithoutImage}, ${HeadingWithImage} {
      font-size: ${({theme}) => theme.typography.h3.fontSize};
    }
  }
`
