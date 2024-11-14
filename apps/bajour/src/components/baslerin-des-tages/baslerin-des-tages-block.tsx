import {ApiV1, BuilderTeaserListBlockProps} from '@wepublish/website'
import {BaslerinDesTages} from './baslerin-des-tages'

export const BaslerinDesTagesBlock = ({teasers, className}: BuilderTeaserListBlockProps) => {
  const article = (teasers[0] as ApiV1.ArticleTeaser | undefined)?.article!

  if (!article) {
    return null
  }

  return <BaslerinDesTages article={article} className={className} />
}
