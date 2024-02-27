import {Button, styled} from '@mui/material'
import {
  ApiV1,
  BuilderTeaserGridBlockProps,
  selectTeaserAuthors,
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
  useWebsiteBuilder
} from '@wepublish/website'
import Image from 'next/image'
import {useState} from 'react'

import {ArchiveSlider} from './archive-slider'

export type ArchiveProps = Omit<BuilderTeaserGridBlockProps, 'teasers'> & {
  teasers: ApiV1.ArticleTeaser[] | ApiV1.PeerArticleTeaser[]
}

const ArchiveWrapper = styled('div')`
  margin: ${({theme}) => theme.spacing(4)} 0;
  display: grid;
  grid-gap: ${({theme}) => theme.spacing(4)};
  padding: 0 ${({theme}) => theme.spacing(2)};
  justify-content: center;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: auto auto;
  grid-gap: ${({theme}) => theme.spacing(1)};

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: 0;
  }
`

const BestOfBajour = styled('div')`
  text-transform: uppercase;
  display: flex;
  align-items: center;
  font-size: 13px;
  grid-column: 1/6;
  grid-row: 1/2;
  justify-content: center;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column: 1/7;
    font-size: 27px;
  }
`

const BajourLogo = styled(Image)`
  margin: 0 ${({theme}) => theme.spacing(1)} 0 ${({theme}) => theme.spacing(2)};
  width: 100px;
  height: 65px;

  ${({theme}) => theme.breakpoints.up('md')} {
    margin: 0 ${({theme}) => theme.spacing(2)} 0 ${({theme}) => theme.spacing(3)};
    width: 250px;
    height: 150px;
  }
`

const ArchivText = styled('span')`
  font-weight: 600;
  color: ${({theme}) => theme.palette.secondary.main};
`

const Timeline = styled('div')`
  position: relative;
  font-weight: 600;
  display: grid;
  color: ${({theme}) => theme.palette.secondary.main};
  grid-column: 3/7;
  grid-row: 2/3;
  grid-template-columns: 1fr 1fr;
  font-size: 10px;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 27px;
  }
`

const Articles = styled('div')`
  grid-column: 1/2;
  text-align: right;
  padding-right: ${({theme}) => theme.spacing(3)};
  display: flex;
  flex-direction: column;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-right: ${({theme}) => theme.spacing(6)};
  }
`

const Authors = styled('div')`
  grid-column: 2/3;
  text-align: left;
  padding-left: ${({theme}) => theme.spacing(3)};
  display: flex;
  flex-direction: column;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-left: ${({theme}) => theme.spacing(6)};
  }
`

const Years = styled('div')`
  grid-column: 1/2;
  text-align: right;
  padding-right: ${({theme}) => theme.spacing(3)};
  display: flex;
  flex-direction: column;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-right: ${({theme}) => theme.spacing(6)};
  }
`

const Number = styled('span')`
  font-size: 44px;
  line-height: 1;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 100px;
  }
`

const Axis = styled('div')`
  position: absolute;
  top: -15%;
  left: 50%;
  transform: translateX(-50%);
  width: ${({theme}) => theme.spacing(2)};
  background-color: ${({theme}) => theme.palette.secondary.main};
  height: 135%;
  border-radius: ${({theme}) => theme.spacing(2)};
  border: 4px solid ${({theme}) => theme.palette.common.white};
  z-index: 10;

  ${({theme}) => theme.breakpoints.up('md')} {
    width: ${({theme}) => theme.spacing(3)};
    border: 5px solid ${({theme}) => theme.palette.common.white};
  }
`

const CarouselWrapper = styled('div')`
  position: relative;
  width: 100%;
  top: -${({theme}) => theme.spacing(2)};

  ${({theme}) => theme.breakpoints.up('md')} {
    top: 0;
  }
`

const Highlights = styled('span')`
  position: absolute;
  top: -${({theme}) => theme.spacing(3)};
  left: 5%;
  font-size: 13px;
  font-weight: bold;
  color: ${({theme}) => theme.palette.secondary.main};

  ${({theme}) => theme.breakpoints.up('md')} {
    top: -${({theme}) => theme.spacing(7)};
    font-size: 35px;
  }
`

const CurrentTeaser = styled('div')`
  padding: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: ${({theme}) => theme.spacing(7)};
  }
`

const ReadMoreButton = styled(Button)`
  justify-self: end;
  color: ${({theme}) => theme.palette.secondary.main};
`

const Author = styled('div')`
  font-weight: 300;
  font-style: italic;
  font-size: 17px;
  margin-bottom: ${({theme}) => theme.spacing(2)};
`

const Title = styled('div')`
  font-size: 20px;
  font-weight: 700;
`

const Lead = styled('div')`
  margin-bottom: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('md')} {
    max-width: 75%;
  }
`

const LinkWrapper = styled('div')`
  text-align: right;

  ${({theme}) => theme.breakpoints.up('sm')} {
    text-align: left;
  }
`

const Archive = ({teasers}: ArchiveProps) => {
  const [currentTeaser, setCurrentTeaser] = useState(teasers[2])

  const title = currentTeaser && selectTeaserTitle(currentTeaser)
  const lead = currentTeaser && selectTeaserLead(currentTeaser)
  const href = (currentTeaser && selectTeaserUrl(currentTeaser)) ?? ''
  const authors = currentTeaser && selectTeaserAuthors(currentTeaser)

  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <div>
      <ArchiveWrapper>
        <BestOfBajour>
          Best of
          <BajourLogo src="/images/logo.svg" alt="bajour-logo" width={250} height={120} />
          <ArchivText>Archiv</ArchivText>
        </BestOfBajour>
        <Timeline>
          <Articles>
            <Number>2586</Number>
            Artikel
          </Articles>
          <div />
          <Authors>
            <Number>34</Number>
            AutorInnen
          </Authors>
          <div />
          <Years>
            <Number>12</Number>
            Jahre
          </Years>
          <div />
          <Axis />
        </Timeline>
      </ArchiveWrapper>
      <CarouselWrapper>
        <Highlights>Unsere Highlights</Highlights>
        <ArchiveSlider teasers={teasers} setTeaser={setCurrentTeaser} />
      </CarouselWrapper>
      <CurrentTeaser>
        <Title>{title}</Title>
        {authors?.length ? <Author>von {authors?.join(', ')}</Author> : null}
        <Lead>{lead}</Lead>
        <LinkWrapper>
          <Link href={href} target="_blank">
            <ReadMoreButton variant="outlined" color="inherit">
              Weiterlesen
            </ReadMoreButton>
          </Link>
        </LinkWrapper>
      </CurrentTeaser>
    </div>
  )
}

export {Archive}
