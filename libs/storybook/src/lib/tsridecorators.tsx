import { Preview } from '@storybook/react';

import { WithWebsiteProviderDecorator } from './decorators/tsri-website.decorator';

export const tsridecorators = [
  WithWebsiteProviderDecorator,
] as Preview['decorators'];
