import styled from '@emotion/styled'
import {
  BreakBlock,
  HeadingWithImage,
  HeadingWithoutImage,
  RichTextBlockWrapper
} from '@wepublish/block-content/website'

import {ABCWhyte} from '../theme'

export const HauptstadtBreakBlock = styled(BreakBlock)`
  padding: ${({theme}) => theme.spacing(2)} ${({theme}) => theme.spacing(3)};
  background-color: ${({theme}) => theme.palette.grey['100']};
  gap: ${({theme}) => theme.spacing(1)};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr;
    padding: ${({theme}) => theme.spacing(2)} ${({theme}) => theme.spacing(3)};
    gap: ${({theme}) => theme.spacing(1)};
  }

  ${HeadingWithImage},
  ${HeadingWithoutImage} {
    font-family: ${ABCWhyte.style.fontFamily};
    font-style: unset;
    font-size: ${({theme}) => theme.typography.h4.fontSize};
    text-transform: unset;
  }

  ${RichTextBlockWrapper} {
    max-width: unset;

    p {
      font-family: ${ABCWhyte.style.fontFamily};
      font-size: ${({theme}) => theme.typography.body1.fontSize};

      ${({theme}) => theme.breakpoints.up('md')} {
        font-size: ${({theme}) => theme.typography.body1.fontSize};
      }
    }
  }
`
