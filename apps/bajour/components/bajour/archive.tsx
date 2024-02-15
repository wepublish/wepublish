import {styled} from '@mui/material'
import {BuilderTeaserGridBlockProps, Image as BuilderImage} from '@wepublish/website'
import Image from 'next/image'

// import {NextWepublishLink} from '../should-be-website-builder/next-wepublish-link'
// import babaNews from './peers-logos/baba-news.png'

type ArchiveProps = Omit<BuilderTeaserGridBlockProps, 'teasers'> & {
  // has to be any as we cannot import CustomTeaser from @wepublish/website/api
  teasers: any[]
}

const ArchiveWrapper = styled('div')`
  margin: 2rem 0;
  display: grid;
  grid-gap: 2rem;
  padding: 0 1rem;
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
  margin: 0 0.5rem 0 1rem;
  width: 100px;
  height: 65px;

  ${({theme}) => theme.breakpoints.up('md')} {
    margin: 0 1rem 0 1.5rem;
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
  padding-right: 1.5rem;
  display: flex;
  flex-direction: column;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-right: 3rem;
  }
`

const Authors = styled('div')`
  grid-column: 2/3;
  text-align: left;
  padding-left: 1.5rem;
  display: flex;
  flex-direction: column;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-left: 3rem;
  }
`

const Years = styled('div')`
  grid-column: 1/2;
  text-align: right;
  padding-right: 1.5rem;
  display: flex;
  flex-direction: column;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-right: 3rem;
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
  width: 1rem;
  background-color: ${({theme}) => theme.palette.secondary.main};
  height: 135%;
  border-radius: 1rem;
  border: 4px solid white;
  z-index: 10;

  ${({theme}) => theme.breakpoints.up('md')} {
    width: 1.5rem;
    border: 5px solid white;
  }
`

const CarouselWrapper = styled('div')`
  position: relative;
  background-color: green;
  width: 100%;
  top: -1rem;

  ${({theme}) => theme.breakpoints.up('md')} {
    top: 0;
  }
`

const Highlights = styled('span')`
  position: absolute;
  top: -1.5rem;
  left: 5%;
  font-size: 13px;
  font-weight: bold;
  color: ${({theme}) => theme.palette.secondary.main};

  ${({theme}) => theme.breakpoints.up('md')} {
    top: -3.5rem;
    font-size: 35px;
  }
`

const Archive = ({numColumns, teasers, blockStyle, className}: ArchiveProps) => {
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
        <div style={{height: '300px'}}>Carousel goes here</div>
      </CarouselWrapper>
    </div>
  )
}

export {Archive}
