import styled from '@emotion/styled'
import {BuilderPeerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {ContentWrapper} from '@wepublish/content/website'

export const PeerInformationWrapper = styled('aside')`
  display: grid;
  padding: ${({theme}) => theme.spacing(3)};
  gap: ${({theme}) => theme.spacing(1)};
  justify-items: center;
  text-align: center;
  position: relative;
`

export const PeerInformationName = styled('div')`
  display: grid;
  align-items: center;
`

export const PeerInformationCTA = styled('div')`
  *:last-child {
    margin: 0;
  }
`

export const PeerInformationOrigin = styled('div')`
  margin-top: ${({theme}) => theme.spacing(2)};
`

export function PeerInformation({profile, originUrl, className}: BuilderPeerProps) {
  const {
    elements: {Image, Button, Link},
    blocks: {RichText}
  } = useWebsiteBuilder()

  return (
    <ContentWrapper>
      <PeerInformationWrapper className={className}>
        <PeerInformationName>
          {profile?.callToActionImage && <Image image={profile.callToActionImage} />}
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
    </ContentWrapper>
  )
}
