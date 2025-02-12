import {ApiV1, BuilderTeaserListBlockProps} from '@wepublish/website'

import {SearchSlider} from './search-slider'

export const SearchSliderBlock = ({teasers, className}: BuilderTeaserListBlockProps) => {
  const article = (teasers[0] as ApiV1.ArticleTeaser | undefined)?.article

  if (!article) {
    return null
  }

  return <SearchSlider article={article} />
}
