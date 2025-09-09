import styled from '@emotion/styled'
import {
  ListicleBlock,
  ListicleBlockItemCounter,
  ListicleImage,
  ListicleRichtText,
  ListicleTitle
} from '@wepublish/block-content/website'

export const HauptstadtListicle = styled(ListicleBlock)`
  ${ListicleBlockItemCounter} {
    display: none;
  }

  ${ListicleImage} {
    order: 1;
  }

  ${ListicleTitle} {
    order: 2;
    font-size: ${({theme}) => theme.typography.h4};
    justify-self: start;
  }

  ${ListicleRichtText} {
    order: 3;
  }
`
