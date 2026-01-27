import { BuilderFlexBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  isTabbedContentBlockStyle,
  TabbedContent,
} from '../tabbed-content/tabbed-content';
import {
  blockStyleByIndex as blockStyleByIndexTabbedSidebarContent,
  HeroTeaserWithTabbedContent,
  isHeroTeaserWithTabbedSidebarContent,
} from './hero-teaser-with-tabbed-sidebar-content';
import {
  blockStyleByIndex as blockStyleByIndexTabbedMainContent,
  cssByBlockStyle as cssByBlockStyleTabbedMainContent,
  isTabbedMainContent,
  TabbedMainContent,
} from './tabbed-main-content';

export enum TsriTabbedContentType {
  TabbedMainContent = 'TabbedContentMain',
  HeroTeaserWithTabbedSidebarContent = 'TabbedContentSidebar',
}

export const TsriTabbedContent = cond([
  [
    isHeroTeaserWithTabbedSidebarContent,
    props => (
      <HeroTeaserWithTabbedContent
        {...props}
        blockStyleByIndex={blockStyleByIndexTabbedSidebarContent}
      />
    ),
  ],
  [
    isTabbedMainContent,
    props => (
      <TabbedMainContent
        {...props}
        blockStyleByIndex={blockStyleByIndexTabbedMainContent}
        cssByBlockStyle={cssByBlockStyleTabbedMainContent}
      />
    ),
  ],
  [isTabbedContentBlockStyle, props => <TabbedContent {...props} />],
  [
    T,
    (props: BuilderFlexBlockProps) => (
      <div>
        TsriTabbedContent fallback - unknown TabbedContent type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]);
