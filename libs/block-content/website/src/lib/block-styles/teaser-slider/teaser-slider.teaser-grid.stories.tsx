import { Meta } from '@storybook/react';
import TeaserListSlider, {
  Article,
  Event,
  Page,
} from './teaser-slider.teaser-list.stories';

export default {
  ...TeaserListSlider,
  title: 'Blocks/Teaser Grid/Block Styles/Slider',
} as Meta;

export { Article, Event, Page };
