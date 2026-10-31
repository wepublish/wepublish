import { BuilderTitleBlockProps, TitleBlock } from '@wepublish/website/builder';

import { builderBlock } from '../../../blocks/builder-block';

export type TitleConfigProps = Pick<
  BuilderTitleBlockProps,
  'title' | 'preTitle' | 'lead'
>;

export const TitleRender = builderBlock<TitleConfigProps>(TitleBlock);
