import {styled} from '@mui/material'
import {BuilderTeaserGridBlockProps, Image as BuilderImage} from '@wepublish/website'
import Image from 'next/image'

import {NextWepublishLink} from '../should-be-website-builder/next-wepublish-link'
import babaNews from './peers-logos/baba-news.png'

type BestOfWePublishProps = Omit<BuilderTeaserGridBlockProps, 'teasers'> & {
  // has to be any as we cannot import CustomTeaser from @wepublish/website/api
  teasers: any[]
}

const BestOfWePublishWrapper = styled('div')`
  margin: 2rem 0;
  display: grid;
  grid-gap: 2rem;
  padding: 0 1rem;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: 0;
  }
`

const Wrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: repeat(2, 1fr);
  align-items: stretch;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(3, 1fr);
  }
`

const TeaserBackground = styled(BuilderImage)`
  width: 100%;
  object-fit: cover;
`

const PeerLogoWrapper = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  padding-right: 0.4rem;
  padding-bottom: 0.4rem;
  background-color: white;
  z-index: 1;
  width: 3rem;

  ${({theme}) => theme.breakpoints.up('md')} {
    width: 4rem;
    padding-right: 0.6rem;
    padding-bottom: 0.6rem;
  }
`

const LinkWrapper = styled(NextWepublishLink)`
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: auto;
  align-items: center;
  grid-template-columns: 1fr;
  spacing: ${({theme}) => theme.spacing(2)};
  padding-top: 1rem;
  padding-left: 1rem;
  position: relative;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-top: 2rem;
    padding-left: 2rem;
  }
`

const BestOfWePublishHeader = styled('div')`
  width: 100%;
  background-color: #ffbaba;

  > span {
    background-color: white;
    color: #ffbaba;
    font-size: 1.4rem;
    font-weight: bold;
    margin-left: 20%;
    padding: 0 1rem;
    display: inline-block;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    > span {
      font-size: 2rem;
    }
  }
`

const BestOfWePublishFooter = styled('div')`
  position: relative;
  display: flex;
  width: 100%;
  background-color: #ffbaba;

  > div {
    background-color: white;
    color: #ffbaba;
    margin-left: 7%;
    padding: 0 0.3rem;
    display: inline-block;
    height: 100%;
  }

  > span {
    font-weight: 300;
    padding: 0.5rem 0 2rem 1rem;
    display: inline-block;
    > b {
      font-weight: 400;
    }
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    > div {
      padding: 0 1rem;
    }
    > span {
      padding: 0.5rem 0 3rem 1.5rem;
    }
  }
`

const InnerContainer = styled('div')`
  position: relative;
  display: grid;
  align-content: space-between;
`

const Content = styled('div')`
  display: inline-block;
  padding: 0.2rem;
  position: absolute;
  bottom: 0;
  left: 0;

  > div {
    // no other way of doing it and maintining current design i.e. line clamp and box would make the white bg 100% wide
    max-height: 78px;
    overflow: hidden;
  }

  span {
    color: #2b2e34;
    background: white;
    padding: 1px 2rem 0.5px 0;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    bottom: 0.8rem;
    left: 0.8rem;

    > div {
      max-height: 82.5px;
    }
  }
`

const Title = styled('span')`
  font-size: 14px;
  font-weight: 600;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 22px;
  }
`

const Peer = styled('span')`
  font-size: 12px;
  font-weight: 600;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 16px;
  }
`

const MoreButton = styled('a')`
  padding: 0.5rem 1.5rem;
  background-color: white;
  border: 3px solid #ffbaba;
  color: #ffbaba;
  border-radius: 0.5rem;
  font-size: 20px;
  position: absolute;
  right: 2%;
  bottom: -15%;
  text-decoration: none;

  ${({theme}) => theme.breakpoints.up('md')} {
    border-radius: 1rem;
    padding: 1rem 2.5rem;
    font-size: 27px;
    right: 5%;
    bottom: -30%;
  }
`

const BestOfWePublish = ({numColumns, teasers, blockStyle, className}: BestOfWePublishProps) => {
  return (
    <BestOfWePublishWrapper>
      <BestOfWePublishHeader>
        <span>Best of We.Publish</span>
      </BestOfWePublishHeader>
      <Wrapper>
        {teasers.map(teaser => {
          const values = {
            image: teaser?.image || teaser?.article?.image,
            href: teaser?.article?.url,
            title: teaser?.title || teaser?.article?.title,
            peerName: teaser?.peer?.name,
            peerLogo: teaser?.peer?.profile?.logo.squareSmallURL || ''
          }

          return (
            <LinkWrapper color="inherit" underline="none" href={values.href} key={values.title}>
              <PeerLogoWrapper>
                {/* not possible to use next/image with dynamic domains */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={values.peerLogo}
                  alt="Peer logo"
                  style={{
                    width: '100%',
                    height: 'auto'
                  }}
                />
              </PeerLogoWrapper>
              <InnerContainer>
                {values.image && <TeaserBackground image={values.image} />}
                <Content>
                  <div>
                    <Title>{values.title}</Title>
                  </div>
                  <div>
                    <Peer>by {values.peerName}</Peer>
                  </div>
                </Content>
              </InnerContainer>
            </LinkWrapper>
          )
        })}
      </Wrapper>
      <BestOfWePublishFooter>
        <div />
        <span>
          <b>We.Publish – Ökosystem für Schweizer Medien</b>
          <br />
          Die We.Publish Foundation fördert unabhängige journalistische <br />
          Angebote und die Medienvielfalt in der Schweiz.
        </span>
        <MoreButton href="https://wepublish.ch/de/home/" target="_blank">
          Mehr zu We.Publish
        </MoreButton>
      </BestOfWePublishFooter>
    </BestOfWePublishWrapper>
  )
}

export {BestOfWePublish}
