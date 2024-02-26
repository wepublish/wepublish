import {styled} from '@mui/material'
import {ApiV1, Image as BuilderImage} from '@wepublish/website'

import {NextWepublishLink} from '../../should-be-website-builder/next-wepublish-link'

interface BestOfWePublishTeasersProps {
  teasers?: ApiV1.PeerArticleTeaser[]
}

const TeaserBackground = styled(BuilderImage)`
  width: 100%;
  object-fit: cover;
`

const PeerLogoWrapper = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  padding-right: ${({theme}) => theme.spacing(1)};
  padding-bottom: ${({theme}) => theme.spacing(1)};
  background-color: white;
  z-index: 1;
  width: 3rem;

  ${({theme}) => theme.breakpoints.up('md')} {
    width: 4rem;
  }
`

const LinkWrapper = styled(NextWepublishLink)`
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: auto;
  align-items: center;
  grid-template-columns: 1fr;
  spacing: ${({theme}) => theme.spacing(2)};
  padding-top: ${({theme}) => theme.spacing(2)};
  padding-left: ${({theme}) => theme.spacing(2)};
  position: relative;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-top: ${({theme}) => theme.spacing(4)};
    padding-left: ${({theme}) => theme.spacing(4)};
  }
`

const InnerContainer = styled('div')`
  position: relative;
  display: grid;
  align-content: space-between;
`

const Content = styled('div')`
  display: inline-block;
  margin: 0.2rem;
  position: absolute;
  bottom: 0;
  left: 0;

  ${({theme}) => theme.breakpoints.up('md')} {
    bottom: 0.8rem;
    left: 0.8rem;
  }
`

const ContentElement = styled('div')`
  // no other way of doing it and maintining current design i.e. line clamp and box would make the white bg 100% wide
  max-height: 78px;
  overflow: hidden;

  ${({theme}) => theme.breakpoints.up('md')} {
    max-height: 82.5px;
  }
`

const ContentText = styled('span')`
  color: #2b2e34;
  background: white;
  padding: 1px ${({theme}) => theme.spacing(4)} 0.5px 0;
`

const Title = styled(ContentText)`
  font-size: 14px;
  font-weight: 600;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 22px;
  }
`

const Peer = styled(ContentText)`
  font-size: 12px;
  font-weight: 600;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 16px;
  }
`

const BestOfWePublishTeasers = ({teasers}: BestOfWePublishTeasersProps) => {
  return (
    <>
      {teasers?.map(teaser => {
        const values = {
          image: teaser?.image || teaser?.article?.image,
          href: teaser?.article?.url,
          title: teaser?.title || teaser?.article?.title,
          peerName: teaser?.peer?.name,
          peerLogo: (teaser?.peer?.profile?.logo as ApiV1.FullImageFragment)?.squareSmallURL || ''
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
                <ContentElement>
                  <Title>{values.title}</Title>
                </ContentElement>
                <ContentElement>
                  <Peer>by {values.peerName}</Peer>
                </ContentElement>
              </Content>
            </InnerContainer>
          </LinkWrapper>
        )
      })}
    </>
  )
}

export {BestOfWePublishTeasers}
