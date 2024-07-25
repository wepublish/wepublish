import {Banner, BuilderBlockStyleProps} from '@wepublish/website'

import {Container} from '../../layout/container'
import {FullWidthContainer} from '../../layout/full-width-container'

export const BabanewsBanner = (block: BuilderBlockStyleProps['Banner']) => (
  <FullWidthContainer>
    <Container>
      <Banner {...block} />
    </Container>
  </FullWidthContainer>
)
