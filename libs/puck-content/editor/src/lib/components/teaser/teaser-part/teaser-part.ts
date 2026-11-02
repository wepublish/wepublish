import {
  HideWhenEmptyProps,
  PuckBlockComponent,
  TeaserPartType,
} from '@wepublish/puck-content/website';
import { createElement } from 'react';

import { editorRender } from '../../../blocks/editor-render';
import { SwitchField, switchFieldAi } from '../../../switch/switch.field';
import {
  TeaserPartEditorBlock,
  TeaserPartEditorExtra,
} from './teaser-part-editor.component';

const teaserPartEditorExtra: TeaserPartEditorExtra = { editing: true };

export const teaserPartRender = <Props extends HideWhenEmptyProps>(
  part: TeaserPartType,
  render: PuckBlockComponent<Props>
) =>
  editorRender<Props, TeaserPartEditorExtra>(
    renderProps =>
      createElement(TeaserPartEditorBlock<Props>, {
        ...renderProps,
        part,
        render,
      }),
    { useExtra: () => teaserPartEditorExtra }
  );

export const hideWhenEmptyField: SwitchField = {
  type: 'switch',
  label: 'Hide when empty',
  defaultValue: true,
  ai: switchFieldAi(
    'Whether the part renders nothing when the record has no value for it. Turn it off to keep the empty space so teasers next to each other stay aligned.'
  ),
};

export const hideWhenEmptyInstructions = (value: string) =>
  ` hideWhenEmpty (on by default) renders nothing when the record has no ${value}; switch it off to keep the empty space so neighbouring teasers stay aligned.`;
