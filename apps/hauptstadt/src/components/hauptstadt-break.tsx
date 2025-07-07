import styled from '@emotion/styled'
import {BreakBlock, BreakBlockButton, RichTextBlockWrapper} from '@wepublish/block-content/website'

export const HauptstadtBreakBlock = styled(BreakBlock)`
  padding: ${({theme}) => theme.spacing(2)} ${({theme}) => theme.spacing(2.5)};
  background-color: ${({theme}) => theme.palette.grey['100']};
  gap: ${({theme}) => theme.spacing(1)};
  justify-content: unset;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr;
    padding: ${({theme}) => theme.spacing(2)} ${({theme}) => theme.spacing(3)};
    gap: ${({theme}) => theme.spacing(1)};
  }

  ${RichTextBlockWrapper} {
    max-width: unset;
  }

  ${BreakBlockButton} {
    justify-self: center;
  }
`
