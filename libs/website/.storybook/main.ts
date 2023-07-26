import {StorybookConfig} from '@storybook/react-webpack5'
// eslint-disable-next-line @nx/enforce-module-boundaries
import rootMain from '../../../.storybook/main'

export default {
  ...rootMain,
  core: {...rootMain.core, builder: 'webpack5'},
  stories: ['../../**/src/lib/**/*.mdx', '../../**/src/lib/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [...(rootMain.addons ?? []), '@nx/react/plugins/storybook']
} as StorybookConfig
