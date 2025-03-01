import {css, styled} from '@mui/material'
import {BuilderPeerProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const PeerInformationWrapper = styled('aside')`
  display: grid;
  padding: ${({theme}) => theme.spacing(3)};
  gap: ${({theme}) => theme.spacing(3)};
  justify-items: center;
  text-align: center;
  position: relative;
`

export const PeerInformationName = styled('div')`
  display: grid;
  grid-template-columns: 65px 1fr;
  gap: ${({theme}) => theme.spacing(3)};
  align-items: center;
`

export const PeerInformationCTA = styled('div')`
  *:last-child {
    margin: 0;
  }
`

export const PeerInformationOrigin = styled('div')`
  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      position: absolute;
      top: ${theme.spacing(3)};
      left: ${theme.spacing(3)};
    }
  `}
`

const logoStyles = css`
  border-radius: 50%;
`

export function PeerInformation({profile, originUrl, className}: BuilderPeerProps) {
  const {
    elements: {Image, Button, Link, H5},
    blocks: {RichText}
  } = useWebsiteBuilder()

  return (
    <PeerInformationWrapper className={className}>
      <PeerInformationName>
        {profile?.logo && <Image image={profile.logo} square css={logoStyles} />}

        <H5 component={'span'}>{profile?.name}</H5>
      </PeerInformationName>

      <PeerInformationCTA>
        <Button
          variant="contained"
          color="primary"
          href={profile?.callToActionURL ?? profile?.websiteURL}
          LinkComponent={Link}>
          <RichText richText={profile?.callToActionText ?? []} />
        </Button>
      </PeerInformationCTA>

      {originUrl && (
        <PeerInformationOrigin>
          <Link href={originUrl}>Zum Originalartikel</Link>
        </PeerInformationOrigin>
      )}
    </PeerInformationWrapper>
  )
}
