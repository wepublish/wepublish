import {
  FullPuckBlockFragment,
  PuckBlockTemplateContentFragment,
} from '@wepublish/website/api';

import { PuckBlockData } from '../../../blocks/block.types';

export const LINKED_TEMPLATE_TYPE = 'LinkedTemplate';
export const LINKED_TEMPLATE_SLOT = 'template';

export type LinkedTemplateProps = { templateId?: string };

export type LinkedTemplateData = PuckBlockData & {
  template?: PuckBlockTemplateContentFragment | null;
};

export const linkedTemplateBlocks = (
  template: PuckBlockTemplateContentFragment
): FullPuckBlockFragment[] =>
  template.puckBlocks.map(block => ({
    ...block,
    data: { ...block.data, template: null },
  }));
