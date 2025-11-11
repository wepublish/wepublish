import { Preview } from '@storybook/react';

import { WithWebsiteProviderDecorator } from './decorators/website.decorator';

export const decorators = [
  WithWebsiteProviderDecorator,
] as Preview['decorators'];
