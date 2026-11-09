import { Blocks } from '@wepublish/block-content/website';
import { BuilderBlocksProps } from '@wepublish/website/builder';

import { ArticleBodyContext } from './courant-article-body.context';

export const CourantBlocks = (props: BuilderBlocksProps) => (
  <ArticleBodyContext.Provider value={props.type === 'Article'}>
    <Blocks {...props} />
  </ArticleBodyContext.Provider>
);
