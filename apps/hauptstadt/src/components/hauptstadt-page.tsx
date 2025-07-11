import styled from '@emotion/styled'
import {ImageBlockWrapper, TitleBlockWrapper} from '@wepublish/block-content/website'
import {Page} from '@wepublish/page/website'

import {breakoutContainerOnXs} from '../utils/breakout-container'

export const HauptstadtPage = styled(Page)`
  > ${TitleBlockWrapper}:first-child {
    margin-top: ${({theme}) => theme.spacing(1)};
  }

  > ${ImageBlockWrapper}:first-of-type img {
    // only breakout the image so that the caption is still aligned
    ${breakoutContainerOnXs}
  }
`
