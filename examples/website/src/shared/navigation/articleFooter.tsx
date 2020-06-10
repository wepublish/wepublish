import React from 'react'
import {Peer, ArticleMeta} from '../types'
import {RelatedArticle} from '../molecules/relatedArticle'
import {Tag} from '../atoms/tag'
import {Link, AuthorRoute, ArticleRoute} from '../route/routeContext'
import {TagList} from '../atoms/tagList'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {Author} from '../types'
import {RoundImage} from '../atoms/roundImage'

import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {GridBlock} from '../blocks/gridBlock'
import {usePermanentVisibility} from '../utils/hooks'

const ArticleFooterStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease'
}))

const AuthorStyle = cssRule(() => ({
  borderTop: `1px solid ${Color.Secondary}`,
  backgroundColor: Color.SecondaryLight,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: `${pxToRem(15)} ${pxToRem(25)}`
}))

const AuthorTagStyle = cssRule({
  display: 'flex',
  marginLeft: pxToRem(15),

  '> div': {
    marginBottom: 0
  }
})

const TagListStyle = cssRule({
  borderTop: `1px solid ${Color.Secondary}`,
  marginBottom: pxToRem(25),
  paddingTop: pxToRem(25),

  ...whenTablet({
    marginBottom: pxToRem(40)
  }),

  ...whenDesktop({
    marginBottom: pxToRem(40)
  })
})

const TitleStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease',

  fontSize: pxToRem(14),
  padding: pxToRem(25),
  textAlign: 'center',
  borderTop: `1px solid ${Color.Secondary}`,
  borderBottom: `1px solid ${Color.Secondary}`
}))

export interface ArticleFooterProps {
  readonly relatedArticles: ArticleMeta[]
  readonly tags: string[]
  readonly authors?: Author[]
  readonly peer?: Peer
  readonly showImage?: boolean
  isPeerArticle?: boolean
}

export function ArticleFooter(props: ArticleFooterProps) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})
  const hasRelatedArticles = props.relatedArticles.length >= 1
  const hasTags = props.tags.length >= 1

  return (
    <div>
      <div ref={ref} className={css(ArticleFooterStyle)}>
        {hasTags ? (
          <div className={css(TagListStyle)}>
            <TagList peer={props.peer} tags={props.tags} />
          </div>
        ) : (
          ''
        )}
        {props.authors &&
          props.authors.map(author => {
            return (
              <div key={author.id} className={css(AuthorStyle)}>
                {author.image && <RoundImage width={60} height={60} src={author.image.url} />}
                {props.isPeerArticle ? (
                  <Link className={css(AuthorTagStyle)} href={author.url}>
                    <a className={css(AuthorTagStyle)}>
                      <Tag title={author.name} />
                    </a>
                  </Link>
                ) : (
                  <Link
                    className={css(AuthorTagStyle)}
                    route={AuthorRoute.create({id: author.slug || author.id})}>
                    <a className={css(AuthorTagStyle)}>
                      <Tag title={author.name} />
                    </a>
                  </Link>
                )}
              </div>
            )
          })}
      </div>
      {hasRelatedArticles ? <RelatedArticleList articles={props.relatedArticles} /> : ''}
    </div>
  )
}

export interface RelatedArticleListProps {
  readonly articles: ArticleMeta[]
}

export function RelatedArticleList({articles}: RelatedArticleListProps) {
  const showImage = articles.length < 3
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})

  return (
    <div>
      <div ref={ref} className={css(TitleStyle)}>
        Weitere Artikel
      </div>
      <GridBlock numColumns={showImage ? 1 : 3}>
        {articles.map(article => (
          <Link key={article.id} route={ArticleRoute.create({id: article.id, slug: article.slug})}>
            <RelatedArticle
              text={article.title}
              peer={article.peer}
              tags={article.tags}
              image={article.image}
              showImage={showImage}
            />
          </Link>
        ))}
      </GridBlock>
    </div>
  )
}
