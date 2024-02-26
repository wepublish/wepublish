import {styled} from '@mui/material'
import {ApiV1, BuilderTeaserGridBlockProps} from '@wepublish/website'

import {BestOfWePublishTeasers} from './best-of-wepublish-teasers'

export type BestOfWePublishProps = Omit<BuilderTeaserGridBlockProps, 'teasers'> & {
  teasers?: Array<ApiV1.PeerArticleTeaser>
}

const BestOfWePublishWrapper = styled('div')`
  grid-column: 1/13;
  margin: 2rem 0;
  display: grid;
  grid-gap: 2rem;
  padding: 0 ${({theme}) => theme.spacing(2)};

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

const BestOfWePublishHeader = styled('div')`
  width: 100%;
  background-color: #ffbaba;
`

const HeaderText = styled('span')`
  background-color: ${({theme}) => theme.palette.common.white};
  color: #ffbaba;
  font-size: 1.4rem;
  font-weight: bold;
  margin-left: 20%;
  padding: 0 ${({theme}) => theme.spacing(2)};
  display: inline-block;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 2rem;
  }
`

const BestOfWePublishFooter = styled('div')`
  position: relative;
  display: flex;
  width: 100%;
  background-color: #ffbaba;
`

const FooterSeparator = styled('div')`
  background-color: ${({theme}) => theme.palette.common.white};
  color: #ffbaba;
  margin-left: 7%;
  padding: 0 ${({theme}) => theme.spacing(0.5)};
  display: inline-block;
  height: 100%;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: 0 ${({theme}) => theme.spacing(2)};
  }
`

const FooterContent = styled('span')`
  font-weight: 300;
  padding: ${({theme}) => theme.spacing(1)} 0 ${({theme}) => theme.spacing(4)}
    ${({theme}) => theme.spacing(2)};
  display: inline-block;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: ${({theme}) => theme.spacing(1)} 0 ${({theme}) => theme.spacing(6)}
      ${({theme}) => theme.spacing(3)};
  }
`

const WePublishEcosystem = styled('b')`
  font-weight: 400;
`

const MoreButton = styled('a')`
  padding: ${({theme}) => theme.spacing(1)} ${({theme}) => theme.spacing(3)};
  background-color: ${({theme}) => theme.palette.common.white};
  border: 3px solid currentColor;
  color: #ffbaba;
  border-radius: 0.5rem;
  font-size: 20px;
  position: absolute;
  right: 2%;
  bottom: -15%;
  text-decoration: none;

  ${({theme}) => theme.breakpoints.up('md')} {
    border-radius: 1rem;
    padding: ${({theme}) => theme.spacing(2)} ${({theme}) => theme.spacing(5)};
    font-size: 27px;
    right: 5%;
    bottom: -30%;
  }
`

const BestOfWePublish = ({teasers}: BestOfWePublishProps) => (
  <BestOfWePublishWrapper>
    <BestOfWePublishHeader>
      <HeaderText>Best of We.Publish</HeaderText>
    </BestOfWePublishHeader>
    <Wrapper>
      <BestOfWePublishTeasers teasers={teasers} />
    </Wrapper>
    <BestOfWePublishFooter>
      <FooterSeparator />
      <FooterContent>
        <WePublishEcosystem>We.Publish – Ökosystem für Schweizer Medien</WePublishEcosystem>
        <div>Die We.Publish Foundation fördert unabhängige journalistische</div>
        <div>Angebote und die Medienvielfalt in der Schweiz.</div>
      </FooterContent>
      <MoreButton href="https://wepublish.ch/de/home/" target="_blank">
        Mehr zu We.Publish
      </MoreButton>
    </BestOfWePublishFooter>
  </BestOfWePublishWrapper>
)

export {BestOfWePublish}
