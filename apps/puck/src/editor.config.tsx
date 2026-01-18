import { Grid } from './components/grid';
import { Quote } from './components/quote';
import { Listicle } from './components/listicle';
import { Event } from './components/event';
import { Title } from './components/title';
import { Html } from './components/html';
import { Break } from './components/break';
import { RichText } from './components/richtext';
import { root } from './root';
import { Space } from './components/space';
import { Teaser } from './components/teaser';
import { UserConfig } from './types';
import { FacebookVideo, Facebook, Instagram } from './components/facebook';
import { IFrame } from './components/iframe';
import { TikTok } from './components/tiktok';
import { Vimeo } from './components/vimeo';
import { YouTube } from './components/youtube';
import { Subscribe } from './components/subscribe';
import { TeaserList } from './components/teaser-list';
import { UserGenerics } from '@puckeditor/core';

export const puckConfig: UserConfig = {
  root,
  components: {
    Grid,
    Title,
    Quote,
    Html,
    Break,
    Space,
    Teaser,
    RichText,
    Listicle,
    Event,
    IFrame,
    Facebook,
    FacebookVideo,
    Instagram,
    YouTube,
    Vimeo,
    TikTok,
    Subscribe,
    TeaserList,
  },
  categories: {
    recommended: {
      components: ['Title', 'RichText', 'Subscribe'],
    },
    blocks: {
      components: ['Title', 'Quote', 'Html', 'Break'],
      defaultExpanded: false,
    },
    layout: {
      components: ['Grid', 'Space'],
      defaultExpanded: false,
    },
    embed: {
      components: [
        'IFrame',
        'YouTube',
        'FacebookVideo',
        'Facebook',
        'Instagram',
        'TikTok',
      ],
      defaultExpanded: false,
    },
    other: {
      defaultExpanded: false,
    },
  },
};

export type PuckData = UserGenerics<typeof puckConfig>['UserData'];
