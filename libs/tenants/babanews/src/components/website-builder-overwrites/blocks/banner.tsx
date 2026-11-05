import { Banner } from '@wepublish/block-content/website';
import { BuilderBlockStyleProps } from '@wepublish/website/builder';

import { Container } from '../../layout/container';
import { FullWidthContainer } from '../../layout/full-width-container';

export const BabanewsBanner = (block: BuilderBlockStyleProps['Banner']) => (
  <FullWidthContainer>
    <Container>
      <Banner {...block} />
    </Container>
  </FullWidthContainer>
);
