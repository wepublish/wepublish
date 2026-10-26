import { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  mockEngagementAction,
  mockEngagementPrompt,
  mockHardEngagementPrompt,
  mockImage,
} from '@wepublish/storybook/mocks';
import {
  EngagementActionType,
  EngagementPlacement,
} from '@wepublish/website/api';
import { action } from 'storybook/actions';
import { EngagementPrompt } from './engagement-prompt';

export default {
  component: EngagementPrompt,
  title: 'Components/EngagementPrompt',
  args: {
    onDismiss: action('dismiss'),
    onAction: action('action'),
  },
} satisfies Meta<typeof EngagementPrompt>;

export const Modal = {
  args: {
    prompt: mockEngagementPrompt(),
  },
} satisfies StoryObj<typeof EngagementPrompt>;

export const Inline = {
  args: {
    prompt: mockEngagementPrompt({
      stage: {
        placement: EngagementPlacement.Inline,
        image: mockImage(),
        cta: 'Every Friday in your inbox.',
      },
    }),
  },
} satisfies StoryObj<typeof EngagementPrompt>;

export const NotDismissible = {
  args: {
    onDismiss: undefined,
    prompt: mockEngagementPrompt({
      stage: { placement: EngagementPlacement.Inline, dismissible: false },
    }),
  },
} satisfies StoryObj<typeof EngagementPrompt>;

export const HardCutoff = {
  args: {
    onDismiss: undefined,
    prompt: mockHardEngagementPrompt(),
  },
} satisfies StoryObj<typeof EngagementPrompt>;

export const HardCutoffForMembers = {
  args: {
    onDismiss: undefined,
    prompt: mockHardEngagementPrompt({
      title: 'Become a member to keep reading',
      actions: [
        mockEngagementAction({
          id: 'membership',
          type: EngagementActionType.Membership,
          label: '',
          url: '',
        }),
        mockEngagementAction({
          id: 'newsletter',
          type: EngagementActionType.Newsletter,
          label: 'Or get our newsletter',
          url: 'https://example.com/newsletter',
        }),
      ],
    }),
  },
} satisfies StoryObj<typeof EngagementPrompt>;
