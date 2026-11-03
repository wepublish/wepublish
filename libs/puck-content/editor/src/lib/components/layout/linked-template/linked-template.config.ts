import { ComponentConfig } from '@puckeditor/core';
import {
  LinkedTemplateProps,
  PuckBlockComponent,
} from '@wepublish/puck-content/website';
import { MdBookmarks } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';
import { LinkedTemplateCanvas } from './linked-template.component';

export const LinkedTemplateConfig: ComponentConfig<{
  props: LinkedTemplateProps;
  fields: UserFields;
}> = {
  icon: MdBookmarks,
  category: 'layout',
  order: 99,
  hidden: true,
  nameKey: 'puck.blocks.names.LinkedTemplate',
  metadata: { ai: { exclude: true } },
  fields: {
    templateId: {
      type: 'record',
      model: 'blockTemplate',
      label: 'Block template',
    },
  },
  defaultProps: {},
  render: editorRender(
    LinkedTemplateCanvas as PuckBlockComponent<LinkedTemplateProps>
  ),
};
