import {styled} from '@mui/material'
import {BuilderTeaserProps, TeaserWrapper, useWebsiteBuilder} from '@wepublish/website'
import {allPass} from 'ramda'

export const isHotAndTrendingTeaser = allPass([
  ({teaser}: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'daily-news'
])

const HotAndTrendingTeaserWrapper = styled('div')`
  display: grid;
  grid-auto-rows: min-content;
  gap: ${({theme}) => theme.spacing(4)};
  background-color: ${({theme}) => theme.palette.accent.main};
  padding: ${({theme}) => theme.spacing(2)};
`

const HotAndTrendingTitle = styled('h1')``

const HotAndTrendingLinkList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-auto-rows: min-content;
  gap: ${({theme}) => theme.spacing(2)};
`

const HotAndTrendingLink = styled('li')`
  padding-bottom: ${({theme}) => theme.spacing(2)};
  border-bottom: currentColor 1px solid;
  font-size: ${({theme}) => theme.typography.h6};
  font-weight: 600;

  &:last-child {
    border-bottom: 0;
  }
`

export const HotAndTrendingTeaser = ({alignment, teaser}: BuilderTeaserProps) => {
  const {
    elements: {H4, Link}
  } = useWebsiteBuilder()

  return (
    <TeaserWrapper {...alignment}>
      <HotAndTrendingTeaserWrapper>
        <H4 component={HotAndTrendingTitle}>{teaser?.title || 'Hot & Trending'}</H4>

        <HotAndTrendingLinkList></HotAndTrendingLinkList>
      </HotAndTrendingTeaserWrapper>
    </TeaserWrapper>
  )
}
