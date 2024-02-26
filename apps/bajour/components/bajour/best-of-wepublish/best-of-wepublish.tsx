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

const BestOfWePublishHeader = styled('div')`
  width: 100%;
  background-color: #ffbaba;
`

const HeaderText = styled('span')`
  background-color: white;
  color: #ffbaba;
  font-size: 1.4rem;
  font-weight: bold;
  margin-left: 20%;
  padding: 0 1rem;
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
  background-color: white;
  color: #ffbaba;
  margin-left: 7%;
  padding: 0 0.3rem;
  display: inline-block;
  height: 100%;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: 0 1rem;
  }
`

const FooterContent = styled('span')`
  font-weight: 300;
  padding: 0.5rem 0 2rem 1rem;
  display: inline-block;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: 0.5rem 0 3rem 1.5rem;
  }
`

const WePublishEcosystem = styled('b')`
  font-weight: 400;
`

const MoreButton = styled('a')`
  padding: 0.5rem 1.5rem;
  background-color: white;
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
    padding: 1rem 2.5rem;
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
