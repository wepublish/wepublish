import {SubscribePage} from '@wepublish/utils/website'
import {ComponentProps} from 'react'

import { Container } from '../src/components/layout/container';

type MitmachenProps = ComponentProps<typeof SubscribePage>

export default function Mitmachen(props: MitmachenProps) {
  return (
    <Container>
      <SubscribePage {...props} fields={['firstName']} />
    </Container>
  );
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps;
