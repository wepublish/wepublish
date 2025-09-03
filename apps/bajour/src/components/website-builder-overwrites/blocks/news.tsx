import styled from '@emotion/styled'
import {Box} from '@mui/material'

import {
  alignmentForTeaserBlock,
  extractTeaserData,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock
} from '@wepublish/block-content/website'
import {BlockContent, TeaserGridBlock, TeaserListBlock} from '@wepublish/website/api'
import {
  BuilderTeaserListBlockProps,
  BuilderTeaserProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {allPass} from 'ramda'

import {MdEast} from 'react-icons/md'

export const isNewsTeasers = (block: BlockContent): block is TeaserGridBlock | TeaserListBlock =>
  allPass([hasBlockStyle('News'), isTeaserListBlock])(block)

export const NewsBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className
}: Pick<BuilderTeaserListBlockProps, 'teasers' | 'title' | 'blockStyle' | 'className'>) => {
  const filledTeasers = teasers.filter(isFilledTeaser)
  const numColumns = 1
  const {
    elements: {H2, Link, Image}
  } = useWebsiteBuilder()

  return (
    <>
      <NewsTeaserListWrapper>
        <TeaserList>
          <H2 gutterBottom>{title}</H2>
          {filledTeasers.map((teaser, index) => (
            <NewsTeaser
              key={index}
              teaser={teaser}
              numColumns={numColumns}
              alignment={alignmentForTeaserBlock(index, numColumns)}
              blockStyle={blockStyle}
            />
          ))}
          <Link href={'/a/tag/news'}>
            <b>Weitere News &rarr;</b>
          </Link>
        </TeaserList>

        <Filler>
          <img
            src="http://localhost:4100/6fa979ce-9856-43d6-bb1b-e742e94f9d3d?quality=65&sig=euJzvwuZAopb0y8iSy-yIlObpOFB6hMnHYbOn0BFQD8"
            css={{width: '100%'}}
          />
        </Filler>
      </NewsTeaserListWrapper>
    </>
  )
}

const TeaserList = styled('div')`
  display: flex;
  flex-direction: column;
`

const Filler = styled(Box)``

const NewsTeaserListWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({theme}) => theme.spacing(2.5)};

  ${Filler} {
    grid-column: span 3;

    ${({theme}) => theme.breakpoints.up('md')} {
      grid-column: span 1;
    }
  }
`

const NewsTeaserUnstyled = ({teaser, alignment, className}: BuilderTeaserProps) => {
  const {title, preTitle, href} = extractTeaserData(teaser)
  const {
    elements: {H4, Link}
  } = useWebsiteBuilder()
  return (
    <Link href={href} className={className}>
      <span>{preTitle}</span>
      <div>
        <H4 gutterBottom>{title}</H4>
        <MdEast />
      </div>
    </Link>
  )
}

const NewsTeaser = styled(NewsTeaserUnstyled)`
  color: ${({theme}) => theme.palette.text.primary};
  padding: ${({theme}) => `${theme.spacing(1)} ${theme.spacing(0)}`};
  border-bottom: 1px solid ${({theme}) => theme.palette.divider};
  text-decoration: none;

  * {
    font-size: 18px !important;
  }

  > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    :first-child {
      flex-grow: 1;
    }

    svg {
      min-width: 18px;
    }
  }

  > span {
    font-weight: 500;
  }

  h4 {
    font-weight: 300;
  }
`
