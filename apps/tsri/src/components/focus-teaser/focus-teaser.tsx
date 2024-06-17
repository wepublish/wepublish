import {styled} from '@mui/material'
import {
  alignmentForTeaserBlock,
  ApiV1,
  BuilderTeaserListBlockProps,
  hasBlockStyle,
  ImageWrapper,
  isTeaserListBlock,
  TeaserListBlockTeasers,
  useWebsiteBuilder
} from '@wepublish/website'
import {allPass} from 'ramda'

export const isFocusTeaser = (block: ApiV1.Block): block is ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('Focus'), isTeaserListBlock])(block)

const FocusTeaserWrapper = styled('section')`
  grid-column: -1/1;
  display: grid;
  column-gap: ${({theme}) => theme.spacing(2)};
  row-gap: ${({theme}) => theme.spacing(5)};
`

const FocusedTeaserContent = styled('div')`
  display: grid;
  background-color: ${({theme}) => theme.palette.accent.light};

  ${({theme}) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 2fr;
  }
`

const FocusedTeaserTitle = styled('div')`
  display: grid;
  color: ${({theme}) => theme.palette.secondary.contrastText};
  background-color: ${({theme}) => theme.palette.secondary.main};
  text-transform: uppercase;
  align-items: center;
  justify-content: center;
  padding: ${({theme}) => theme.spacing(9)};
`

const FocusedTeaser = styled('div')`
  padding: ${({theme}) => theme.spacing(4)};

  ${ImageWrapper} {
    max-height: 50lvh;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: ${({theme}) => theme.spacing(8)};

    ${ImageWrapper} {
      aspect-ratio: unset;
    }
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    padding: ${({theme}) => theme.spacing(10)};
  }
`

export const selectTags = (teaser: ApiV1.Teaser): ApiV1.Tag[] => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      return teaser.page?.tags ?? []
    }

    case 'ArticleTeaser': {
      return teaser.article?.tags ?? []
    }

    case 'EventTeaser':
      return teaser.event?.tags ?? []

    case 'PeerArticleTeaser':
    case 'CustomTeaser':
      return []
  }

  return []
}

export const FocusTeaser = ({
  teasers,
  filter,
  blockStyle,
  title,
  className
}: BuilderTeaserListBlockProps) => {
  const {
    blocks: {Teaser},
    elements: {Link, H3}
  } = useWebsiteBuilder()

  const [focusedTeaser, ...restTeasers] = teasers

  const focusTeaserTitle = title && <H3 component={'h1'}>{title}</H3>
  const tags =
    focusedTeaser && selectTags(focusedTeaser).filter(({id}) => filter.tags?.includes(id))

  return (
    <FocusTeaserWrapper className={className}>
      <FocusedTeaserContent>
        <FocusedTeaserTitle>
          {tags?.length === 1 && tags[0].url ? (
            <Link href={tags[0].url} color="inherit" underline="none">
              {focusTeaserTitle}
            </Link>
          ) : (
            focusTeaserTitle
          )}
        </FocusedTeaserTitle>

        <FocusedTeaser>
          <Teaser
            teaser={focusedTeaser}
            alignment={alignmentForTeaserBlock(0, 1)}
            blockStyle={blockStyle}
          />
        </FocusedTeaser>
      </FocusedTeaserContent>

      {!!restTeasers.length && (
        <TeaserListBlockTeasers>
          {restTeasers.map((teaser, index) => (
            <Teaser
              key={index}
              teaser={teaser}
              alignment={alignmentForTeaserBlock(index, 4)}
              blockStyle={blockStyle}
            />
          ))}
        </TeaserListBlockTeasers>
      )}
    </FocusTeaserWrapper>
  )
}
