import React from 'react'
import {PageMeta, Peer} from '../types'
import {DisplayComments, LoginToComment} from '../molecules/commentTemplate'
import {Tag} from '../atoms/tag'
import {Link, AuthorRoute, PageRoute} from '../route/routeContext'
import {TagList} from '../atoms/tagList'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {Author, Comment} from '../types'
import {RoundImage} from '../atoms/roundImage'

import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {usePermanentVisibility} from '../utils/hooks'
import {GridBlock} from '../blocks/gridBlock'
import {RelatedPage} from '../molecules/relatedPage'

const PageFooterStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
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

export interface PageFooterProps {
  readonly relatedPages: PageMeta[]
  readonly itemID?: string
  readonly tags: string[]
  readonly authors?: Author[]
  readonly comments?: Comment[]
  readonly peer?: Peer
  readonly showImage?: boolean
}

export function PageFooter(props: PageFooterProps) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})
  const hasTags = props.tags.length >= 1

  return (
    <div>
      <div ref={ref} className={css(PageFooterStyle)}>
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
                <Link
                  className={css(AuthorTagStyle)}
                  route={AuthorRoute.create({id: author.slug || author.id})}>
                  <a className={css(AuthorTagStyle)}>
                    <Tag title={author.name} />
                  </a>
                </Link>
              </div>
            )
          })}
      </div>
      <LoginToComment itemID={props.itemID} itemType={'Page'} />
      <DisplayComments comments={props.comments} />
    </div>
  )
}

export interface RelatedPagesListProps {
  readonly pages: PageMeta[]
}

export function RelatedPageList({pages}: RelatedPagesListProps) {
  const showImage = pages.length < 3
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})

  return (
    <div>
      <div ref={ref} className={css(TitleStyle)}>
        Weitere Artikel
      </div>
      <GridBlock numColumns={showImage ? 1 : 3}>
        {pages.map(page => (
          <Link key={page.id} route={PageRoute.create({slug: page.slug})}>
            <RelatedPage
              text={page.title}
              tags={page.tags}
              image={page.image}
              showImage={showImage}
            />
          </Link>
        ))}
      </GridBlock>
    </div>
  )
}
