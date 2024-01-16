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

export function PeerInformation({data, loading, error, originUrl, className}: BuilderPeerProps) {
  const {
    elements: {Alert, Image, Button, Link, H5},
    blocks: {RichText}
  } = useWebsiteBuilder()

  if (error) {
    return (
      <PeerInformationWrapper>
        <Alert severity="error">{error.message}</Alert>
      </PeerInformationWrapper>
    )
  }

  if (!data?.peer) {
    return null
  }

  return (
    <PeerInformationWrapper className={className}>
      <PeerInformationName>
        {data.peer.profile?.logo && (
          <Image image={data.peer.profile.logo} square css={logoStyles} />
        )}

        <H5 component={'span'}>{data.peer.profile?.name}</H5>
      </PeerInformationName>

      <PeerInformationCTA>
        <Button
          variant="outlined"
          color="secondary"
          href={data.peer.profile?.callToActionURL ?? data.peer.profile?.websiteURL}
          LinkComponent={Link}>
          <RichText richText={data.peer.profile?.callToActionText ?? []} />
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
