import {
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper
} from '../../teaser/base-teaser'
import {css} from '@emotion/react'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {memo} from 'react'

export const teaserLeftImage = css`
  grid-template-areas:
    'image .'
    'image pretitle'
    'image title'
    'image lead'
    'image authors'
    'image .';
  grid-template-columns: ${(100 / 12) * 7}% 1fr;
  grid-template-rows: repeat(6, auto);
`

export const teaserRightImage = css`
  grid-template-areas:
    '. image'
    'pretitle image'
    'title image'
    'lead image'
    'authors image'
    '. image';
  grid-template-columns: 1fr ${(100 / 12) * 7}%;
  grid-template-rows: repeat(6, auto);
`

export const alternatingTeaser = css`
  ${TeaserPreTitleNoContent} {
    grid-area: pretitle;
    width: 20%;
    height: 5px;
  }

  ${TeaserPreTitleWrapper} {
    height: auto;
    width: max-content;
  }

  ${TeaserPreTitle} {
    transform: initial;
  }
`

export const AlternatingTeaser = memo((props: BuilderTeaserProps) => {
  const {
    blocks: {BaseTeaser}
  } = useWebsiteBuilder()

  return (
    <BaseTeaser
      {...props}
      css={css`
        ${(props.index ?? 0) % 2 === 0 ? teaserRightImage : teaserLeftImage}
        ${alternatingTeaser}
      `}
    />
  )
})
