import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockContentGate } from '@wepublish/storybook/mocks';
import { ContentGateAudience } from '@wepublish/website/api';
import { ContentGate } from './content-gate';

export default {
  component: ContentGate,
  title: 'Components/ContentGate',
} satisfies Meta;

export const Soft = {
  args: {
    ...mockContentGate(),
    state: 'soft',
  },
} satisfies StoryObj<typeof ContentGate>;

export const Hard = {
  args: {
    ...mockContentGate(),
    state: 'hard',
  },
} satisfies StoryObj<typeof ContentGate>;

export const ForNonSubscribers = {
  args: {
    ...mockContentGate({ audience: ContentGateAudience.NonSubscribers }),
    state: 'hard',
  },
} satisfies StoryObj<typeof ContentGate>;

export const WithCallToAction = {
  args: {
    ...mockContentGate({
      ctaLabel: 'Jetzt gratis registrieren',
      ctaUrl: '/registrieren',
    }),
    state: 'hard',
  },
} satisfies StoryObj<typeof ContentGate>;
