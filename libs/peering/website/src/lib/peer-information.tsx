import styled from '@emotion/styled';
import {
  BuilderPeerProps,
  Button,
  Image,
  Link,
  RichTextBlock,
} from '@wepublish/website/builder';
import { ImageWrapper } from '@wepublish/image/website';
import { Theme, css } from '@emotion/react';
import { theme } from '@wepublish/ui';
import { toPlaintext } from '@wepublish/richtext';

export const PeerProfileWrapper = styled('div')`
  display: grid;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(2)}
    ${({ theme }) => theme.spacing(2.5)};
  background-color: ${({ theme }) => theme.palette.grey['100']};
  gap: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(2)}
      ${({ theme }) => theme.spacing(3)};
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

export const PeerProfileBanner = styled(Image)`
  object-fit: cover;
  width: 100%;
  max-width: ${({ theme }) => theme.spacing(60)};
  margin: 0 auto;
`;

export const PeerProfileCTA = styled(Button)`
  margin-top: ${({ theme }) => theme.spacing(2)};
  width: fit-content;
  justify-self: center;
`;

const richTextStyles = (theme: Theme) => css`
  p {
    ${theme.typography.peerInformation}
  }
`;

export const PeerInformationWrapper = styled('aside')`
  margin-top: var(--article-content-row-gap);
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-items: center;

  ${ImageWrapper} {
    max-height: 65px;
    object-fit: contain;
  }
`;

export const PeerInformationLink = styled(Link)`
  font-size: 0.875em;
`;

export function PeerInformation({
  profile,
  information,
  originUrl,
  className,
}: BuilderPeerProps) {
  if (!profile) {
    return;
  }

  const linkURL = profile.callToActionURL ?? profile.websiteURL;
  const linkText = toPlaintext(profile.callToActionText ?? []);

  return (
    <PeerInformationWrapper className={className}>
      <PeerProfileWrapper className={className}>
        {profile.callToActionImage && (
          <PeerProfileBanner
            image={profile.callToActionImage}
            maxWidth={500}
          />
        )}

        <RichTextBlock
          richText={information ?? []}
          css={richTextStyles(theme)}
        />

        <PeerProfileCTA
          color="primary"
          variant="contained"
          size="medium"
          LinkComponent={Link}
          href={linkURL ?? ''}
          target={'_blank'}
        >
          {linkText}
        </PeerProfileCTA>
      </PeerProfileWrapper>

      {originUrl && (
        <PeerInformationLink href={originUrl}>
          Zum Originalartikel
        </PeerInformationLink>
      )}
    </PeerInformationWrapper>
  );
}
