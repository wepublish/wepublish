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
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};

  ${({theme}) => theme.breakpoints.up('lg')} {
    gap: ${({theme}) => theme.spacing(13)};
  }
`

const FocusedTeaserContent = styled('div')`
  display: grid;
  background-color: ${({theme}) => theme.palette.accent.light};

  ${({theme}) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 2fr;
  }
`

const FocusedTeaserTitle = styled('h1')`
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

export const FocusTeaser = ({
  teasers,
  blockStyle,
  title,
  className
}: BuilderTeaserListBlockProps) => {
  const {
    blocks: {Teaser},
    elements: {H3}
  } = useWebsiteBuilder()

  const [focusedTeaser, ...restTeasers] = teasers

  return (
    <FocusTeaserWrapper className={className}>
      <FocusedTeaserContent>
        {title && <H3 component={FocusedTeaserTitle}>{title}</H3>}

        <FocusedTeaser>
          <Teaser
            teaser={focusedTeaser}
            alignment={alignmentForTeaserBlock(0, 1)}
            blockStyle={blockStyle}
          />
        </FocusedTeaser>
      </FocusedTeaserContent>

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
    </FocusTeaserWrapper>
  )
}
