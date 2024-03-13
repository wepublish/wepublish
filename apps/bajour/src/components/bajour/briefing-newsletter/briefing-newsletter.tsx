import {Button, styled} from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'

import {ReactComponent as Logo} from '../../../logo.svg'
import BaselBriefingBg from '../briefing/basel.jpg'

const Wrapper = styled('div')`
  display: grid;
  grid-template-columns: 3.5fr 2fr;
  max-width: ${({theme}) => theme.spacing(120)};
  margin: 0 auto;

  ${({theme}) => theme.breakpoints.up('md')} {
    margin: ${({theme}) => theme.spacing(4)} auto;
  }
`

const BaselBriefing = styled('div')`
  position: relative;
  padding: ${({theme}) => theme.spacing(2)};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  ${({theme}) => theme.breakpoints.up('sm')} {
    padding: ${({theme}) => theme.spacing(4)};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    justify-content: space-between;
    padding: ${({theme}) => theme.spacing(6)};
  }
`

const Heading = styled('div')`
  color: ${({theme}) => theme.palette.common.white};
  display: grid;
  width: 100%;
  text-align: center;
`

const BaselBriefingTitle = styled('span')`
  font-weight: bold;
  font-size: ${({theme}) => theme.spacing(4)};
  text-transform: uppercase;
  font-size: 25px;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 43px;
  }
`

const BaselBriefingSubtitle = styled('span')`
  font-weight: bold;
  font-size: 10px;
  text-transform: uppercase;

  ${({theme}) => theme.breakpoints.up('md')} {
    font-size: 17px;
  }
`

const Background = styled(Image)`
  z-index: -1;
`

const BecomeMember = styled('div')`
  padding: ${({theme}) => theme.spacing(1)};
  background-color: ${({theme}) => theme.palette.primary.main};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  ${({theme}) => theme.breakpoints.up('sm')} {
    padding: ${({theme}) => theme.spacing(4)};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    justify-content: space-between;
    margin-left: ${({theme}) => theme.spacing(3)};
  }
`

const BajourLogo = styled(Logo)`
  margin: 0 ${({theme}) => theme.spacing(1)} 0 ${({theme}) => theme.spacing(2)};
  width: ${({theme}) => theme.spacing(10)};
  height: ${({theme}) => theme.spacing(5)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    width: ${({theme}) => theme.spacing(12.5)};
    height: ${({theme}) => theme.spacing(6)};
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    margin: 0 ${({theme}) => theme.spacing(2)} 0 ${({theme}) => theme.spacing(3)};
    width: ${({theme}) => theme.spacing(25)};
    height: ${({theme}) => theme.spacing(12.5)};
  }

  ${({theme}) => theme.breakpoints.up('lg')} {
    margin: 0 ${({theme}) => theme.spacing(2)} 0 ${({theme}) => theme.spacing(3)};
    width: ${({theme}) => theme.spacing(30)};
    height: ${({theme}) => theme.spacing(15)};
  }
`

const SharedButton = styled(Button)`
  padding: ${({theme}) => `${theme.spacing(1)} ${theme.spacing(2)}`};
  font-size: 9px;
  font-weight: 600;
  margin-top: ${({theme}) => theme.spacing(1)};

  ${({theme}) => theme.breakpoints.up('md')} {
    margin-top: ${({theme}) => theme.spacing(2)};
    font-size: 18px;
    padding: ${({theme}) => `${theme.spacing(1.5)} ${theme.spacing(2.5)}`};
  }
`

const BaselBriefingButton = styled(SharedButton)`
  color: ${({theme}) => theme.palette.common.white};
  border: 2px solid ${({theme}) => theme.palette.common.white};
`

const BecomeMemberButton = styled(SharedButton)`
  color: ${({theme}) => theme.palette.common.black};
  border: 2px solid ${({theme}) => theme.palette.common.black};
`

const BriefingNewsletter = () => {
  return (
    <Wrapper>
      <BaselBriefing>
        <Background src={BaselBriefingBg} alt="Basel Briefing" fill />
        <Heading>
          <BaselBriefingTitle>Basel Briefing</BaselBriefingTitle>
          <BaselBriefingSubtitle>Das wichtigste für den tag</BaselBriefingSubtitle>
        </Heading>
        <a href="https://labs.bajour.ch/react/baselbriefing" target="_blank">
          <BaselBriefingButton>JETZT ABONNIEREN</BaselBriefingButton>
        </a>
      </BaselBriefing>
      <BecomeMember>
        <BajourLogo />
        <Link href="/signup">
          <BecomeMemberButton>JETZT MEMBER WERDEN</BecomeMemberButton>
        </Link>
      </BecomeMember>
    </Wrapper>
  )
}

export default BriefingNewsletter
