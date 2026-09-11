import { Preview } from '@storybook/react';

import { WithApolloClientDecorator } from './decorators/apollo.decorator';
import { WithWebsiteProviderDecorator } from './decorators/website.decorator';

export const decorators = [
  WithWebsiteProviderDecorator,
  WithApolloClientDecorator,
] as Preview['decorators'];
