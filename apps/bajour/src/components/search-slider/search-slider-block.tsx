import { ArticleTeaser } from '@wepublish/website/api';
import { BuilderTeaserListBlockProps } from '@wepublish/website/builder';

import { SearchSlider } from './search-slider';

export const SearchSliderBlock = ({
  teasers,
  className,
}: BuilderTeaserListBlockProps) => {
  const article = (teasers[0] as ArticleTeaser | undefined)?.article;

  if (!article) {
    return null;
  }

  return (
    <SearchSlider
      article={article}
      className={className}
    />
  );
};
