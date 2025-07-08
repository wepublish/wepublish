import styled from '@emotion/styled'
import {BuilderPeerProps, Link, useWebsiteBuilder} from '@wepublish/website/builder'
import {toPlaintext} from '@wepublish/richtext'
import {ImageWrapper} from '@wepublish/image/website'

export const PeerInformationWrapper = styled('aside')`
  margin-top: var(--article-content-row-gap);
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  justify-items: center;

  ${ImageWrapper} {
    max-height: 65px;
    object-fit: contain;
  }
`

export const PeerInformationLink = styled(Link)`
  font-size: 0.875em;
`

export function PeerInformation({profile, information, originUrl, className}: BuilderPeerProps) {
  const {
    blocks: {Break}
  } = useWebsiteBuilder()

  if (!profile) {
    return
  }

  return (
    <PeerInformationWrapper className={className}>
      <Break
        richText={information ?? []}
        linkTarget={'_blank'}
        linkText={toPlaintext(profile.callToActionText ?? [])}
        linkURL={profile?.callToActionURL ?? profile?.websiteURL}
        image={profile.callToActionImage}
        css={{width: '100%'}}
      />

      {originUrl && <PeerInformationLink href={originUrl}>Zum Originalartikel</PeerInformationLink>}
    </PeerInformationWrapper>
  )
}
