import { ComponentConfig, Slot } from '@puckeditor/core';
import { TeaserConfigProps } from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { ToPuckSlots } from '../../../blocks/puck-editor-props';
import { Components } from '../../../config.types';
import { UserFields } from '../../../fields';
import { switchFieldAi } from '../../../switch/switch.field';
import {
  TeaserEditorExtra,
  TeaserEditorRender,
} from './teaser-editor.component';

const teaserParts: (keyof Components)[] = [
  'TeaserImage',
  'TeaserPreTitle',
  'TeaserTitle',
  'TeaserLead',
  'TeaserAuthors',
  'TeaserDate',
  'TeaserTags',
];

const layoutBlocks: (keyof Components)[] = [
  'Space',
  'Grid',
  'DynamicGrid',
  'Row',
  'Slider',
  'Container',
  'Collapsible',
];

const interactiveBlocks: (keyof Components)[] = ['Button'];

const starterParts: (keyof Components)[] = [
  'TeaserImage',
  'TeaserPreTitle',
  'TeaserTitle',
  'TeaserLead',
];

const starterContent: Slot = starterParts.map(type => ({ type, props: {} }));

const teaserEditorExtra: TeaserEditorExtra = { editing: true };

export const TeaserConfig: ComponentConfig<{
  props: ToPuckSlots<TeaserConfigProps>;
  fields: UserFields;
}> = {
  label: 'Teaser',
  ai: {
    instructions:
      'A teaser for one article, page or event that the teaser parts inside show. The datasource decides the record: slot (the default) takes the next record from the nearest surrounding block that lists records of the same model, for example a Grid with an article uniqueList holding one Teaser per cell; single picks one record by id. Put TeaserImage, TeaserPreTitle, TeaserTitle, TeaserLead, TeaserAuthors, TeaserDate and TeaserTags, or layout blocks holding them, into the content slot; a Button may go in as well. linkToRecord makes the whole teaser link to the record, while buttons and other interactive blocks inside stay clickable on their own. Teasers cannot be nested. A teaser without a record shows nothing on the website.',
  },
  fields: {
    linkToRecord: {
      type: 'switch',
      label: 'Link to record',
      ai: switchFieldAi(
        'Whether the whole teaser links to the article, page or event it shows.'
      ),
    },
    content: {
      type: 'slot',
      allow: [...teaserParts, ...layoutBlocks, ...interactiveBlocks],
      disallow: ['Teaser'] satisfies (keyof Components)[],
    },
  },
  defaultProps: {
    linkToRecord: true,
    content: starterContent,
  },
  render: editorRender(TeaserEditorRender, {
    minEmptyHeight: 120,
    useExtra: () => teaserEditorExtra,
  }),
};
