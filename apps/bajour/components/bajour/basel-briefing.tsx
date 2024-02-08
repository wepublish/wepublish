import {Button, styled} from '@mui/material'
import {BuilderTeaserProps, Image, TeaserWrapper} from '@wepublish/website'

import {useMailChimpCampaigns} from '../../context/MailChimpContext'
import {NextWepublishLink} from '../should-be-website-builder/next-wepublish-link'
import {fluidTypography} from '../website-builder-overwrites/blocks/teaser-overwrite.style'
import BaselBg from './basel.jpg'
import FasnachtBg from './fasnacht.jpg'
import FcbBg from './fcb.jpg'
import {BriefingType} from './isBriefing'

const baselBg = {
  id: '1234',
  createdAt: new Date('2023-01-01').toDateString(),
  modifiedAt: new Date('2023-01-01').toDateString(),
  extension: '.jpg',
  fileSize: 1,
  format: '',
  height: 500,
  width: 500,
  mimeType: 'image/jpg',
  tags: [],
  url: BaselBg.src,
  bigURL: BaselBg.src,
  largeURL: BaselBg.src,
  mediumURL: BaselBg.src,
  smallURL: BaselBg.src
}

const fcbBg = {
  id: '1234',
  createdAt: new Date('2023-01-01').toDateString(),
  modifiedAt: new Date('2023-01-01').toDateString(),
  extension: '.jpg',
  fileSize: 1,
  format: '',
  height: 500,
  width: 500,
  mimeType: 'image/jpg',
  tags: [],
  url: FcbBg.src,
  bigURL: FcbBg.src,
  largeURL: FcbBg.src,
  mediumURL: FcbBg.src,
  smallURL: FcbBg.src
}

const fasnachtBg = {
  id: '1234',
  createdAt: new Date('2023-01-01').toDateString(),
  modifiedAt: new Date('2023-01-01').toDateString(),
  extension: '.jpg',
  fileSize: 1,
  format: '',
  height: 500,
  width: 500,
  mimeType: 'image/jpg',
  tags: [],
  url: FasnachtBg.src,
  bigURL: FasnachtBg.src,
  largeURL: FasnachtBg.src,
  mediumURL: FasnachtBg.src,
  smallURL: FasnachtBg.src
}

export const BajourBriefingStyled = styled('div')`
  display: grid;
  column-gap: 16px;
  row-gap: 40px;
  grid-template-columns: 1fr;
  align-items: stretch;
  position: relative;
  padding-top: 2rem;
`

const getValuesBasedOnBriefing = (briefing: BriefingType) => {
  switch (briefing) {
    case BriefingType.BaselBriefing: {
      return {
        title: 'Basel Briefing',
        subtitle: 'Das wichtigste für den tag',
        backgroundImage: baselBg,
        welcome: 'Guten morgen!'
      }
    }
    

    case BriefingType.FCB_Briefing: {
      return {
        title: 'FCB Briefing',
        subtitle: 'DAS WICHTIGSTE VOR JEDEM SPIEL',
        backgroundImage: fcbBg,
        welcome: 'Guten morgen!'
      }
    }

    case BriefingType.FasnachtsBriefing: {
      return {
        title: 'FASNACHTS-BRIEFING',
        subtitle: 'DEINE FASNÄCHTLICHE GRUNDVERSORGUNG',
        backgroundImage: fasnachtBg,
        welcome: 'Guten morgen!'
      }
    }
  }
}

const TeaserBackground = styled(Image)`
  width: 100%;
  object-fit: cover;
  position: absolute;
  z-index: -1;
  border-radius: 1rem 1rem 0 0;
  aspect-ratio: 4/3;

  ${({theme}) => theme.breakpoints.up('sm')} {
    aspect-ratio: 2.5/1;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    aspect-ratio: 3/1;
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    border-radius: 2rem 2rem 0 0;
  }

  ${({theme}) => theme.breakpoints.up('xl')} {
    grid-column: 3/12;
  }
`

const LinkWrapper = styled(NextWepublishLink)`
  grid-column: -1/1;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: auto;
  align-items: center;
  grid-template-columns: 1fr;
  spacing: ${({theme}) => theme.spacing(2)};
`

const TeaserContentWrapper = styled('div')`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  width: 100%;
`

const ReadMoreButton = styled(Button)`
  justify-self: end;
  color: #ff2362;
`

const TeaserContentStyled = styled('div')`
  padding: ${({theme}) => theme.spacing(1)};
  grid-template-columns: repeat(12, 1fr);
  grid-column: 3/13;

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-column: 3/12;
    padding: ${({theme}) => `${theme.spacing(2)} ${theme.spacing(1.5)} ${theme.spacing(1.5)}`};
  }

  ${({theme}) => theme.breakpoints.up('xl')} {
    grid-column: 5/8;
  }
`

const Heading = styled('div')`
  margin-top: 2rem;
  color: ${({theme}) => theme.palette.common.white};
  display: grid;
  width: 100%;
  text-align: center;

  ${({theme}) => theme.breakpoints.up('sm')} {
    margin-top: 5rem;
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    margin-top: 7rem;
  }
`

const BaselBriefingTitle = styled('span')`
  font-weight: bold;
  font-size: 2rem;
  text-transform: uppercase;

  ${({theme}) => theme.breakpoints.up('lg')} {
    font-size: 3rem;
  }
`

const BaselBriefingSubtitle = styled('span')`
  font-weight: bold;
  font-size: 0.8rem;
  text-transform: uppercase;

  ${({theme}) => theme.breakpoints.up('lg')} {
    font-size: 1.2rem;
  }
`

const BriefingTextWrapper = styled('div')`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(12, 1fr);
`

const Briefing = styled('div')`
  color: ${({theme}) => theme.palette.common.white};
  background-color: rgba(0, 0, 0, 0.25);
  padding: ${({theme}) =>
    `${theme.spacing(0.5)} ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)}`};
  font-size: ${fluidTypography(12, 26)};
  grid-column: 1/13;

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-column: 3/12;
    border-radius: 1rem 1rem 0 0;
    padding: ${({theme}) =>
      `${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(4)}`};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    border-radius: 2rem 2rem 0 0;
    padding: ${({theme}) =>
      `${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(4)}`};
  }
`
const Welcome = styled('div')`
  font-weight: bold;
`

const BriefingText = styled('div')``

const BriefingContainer = styled('div')`
  position: relative;
  aspect-ratio: 4/3;
  display: grid;
  align-content: space-between;

  ${({theme}) => theme.breakpoints.up('sm')} {
    aspect-ratio: 2.5/1;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    aspect-ratio: 3/1;
  }
`

const TeaserContentInterior = styled('div')`
  position: relative;
  grid-column: 3/13;
  display: grid;
  grid-template-columns: 3fr 4fr;
  padding: ${({theme}) =>
    `${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(3.5)}`};
  border-bottom-right-radius: ${({theme}) => theme.spacing(2)};
  background-color: #ffbaba;
  color: ${({theme}) => theme.palette.common.black};

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-column: 3/12;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: ${({theme}) =>
      `${theme.spacing(1.5)} ${theme.spacing(1.5)} ${theme.spacing(1.5)} ${theme.spacing(5)}`};
  }
`

const Author = styled('div')`
  font-size: ${fluidTypography(8, 22)};
`

export const Avatar = styled(Image)`
  position: absolute;
  border-radius: 50%;
  aspect-ratio: 1/1;
  width: ${({theme}) => theme.spacing(9)};
  height: ${({theme}) => theme.spacing(9)};
  object-fit: cover;
  left: -56px;
  top: -14px;

  ${({theme}) => theme.breakpoints.up('sm')} {
    width: ${({theme}) => theme.spacing(18)};
    height: ${({theme}) => theme.spacing(18)};
    left: -130px;
    top: -48px;
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    width: ${({theme}) => theme.spacing(24)};
    height: ${({theme}) => theme.spacing(24)};
    left: -182px;
    top: -66px;
  }
`

const BaselBriefing = (props: BuilderTeaserProps) => {
  const {alignment, teaser} = props
  const mcCampaigns = useMailChimpCampaigns()

  // not used for now?
  // console.log('mcCampaigns', mcCampaigns)

  // uncomment once ready
  // if (!shouldDisplayBaselBriefing()) {
  //   return null
  // }

  const {image, lead, title, contentUrl} = teaser ?? {}

  const briefingDynamicValues = {
    authorAvatar: image,
    authorName: lead,
    briefingContent: title,
    contentUrl: contentUrl || ''
  }

  const values = getValuesBasedOnBriefing(teaser?.properties[0].key)

  if (!briefingDynamicValues || !values) {
    return null
  }

  return (
    <TeaserWrapper {...alignment}>
      <BajourBriefingStyled>
        <LinkWrapper color="inherit" underline="none" href={briefingDynamicValues.contentUrl}>
          <BriefingContainer>
            {values.backgroundImage && <TeaserBackground image={values.backgroundImage} />}

            <Heading>
              <BaselBriefingTitle>{values.title}</BaselBriefingTitle>
              <BaselBriefingSubtitle>{values.subtitle}</BaselBriefingSubtitle>
            </Heading>

            <BriefingTextWrapper>
              <Briefing>
                <Welcome>{values.welcome}</Welcome>
                <BriefingText>{briefingDynamicValues.briefingContent}</BriefingText>
              </Briefing>
            </BriefingTextWrapper>
          </BriefingContainer>

          <TeaserContentWrapper>
            <TeaserContentStyled>
              <TeaserContentInterior>
                {briefingDynamicValues.authorAvatar && (
                  <Avatar image={briefingDynamicValues.authorAvatar} />
                )}

                {briefingDynamicValues.authorName && (
                  <Author>
                    Heute von <br />
                    {briefingDynamicValues.authorName}
                  </Author>
                )}

                <ReadMoreButton
                  variant="outlined"
                  color="inherit"
                  size="small"
                  href={briefingDynamicValues.contentUrl}>
                  Ganzes Briefing
                </ReadMoreButton>
              </TeaserContentInterior>
            </TeaserContentStyled>
          </TeaserContentWrapper>
        </LinkWrapper>
      </BajourBriefingStyled>
    </TeaserWrapper>
  )
}

export {BaselBriefing}
