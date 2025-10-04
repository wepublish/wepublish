import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  selectTeaserImage,
  selectTeaserTitle,
  selectTeaserUrl,
  TeaserWrapper,
} from '@wepublish/block-content/website';
import { NextWepublishLink } from '@wepublish/utils/website';
import { ArticleTeaser } from '@wepublish/website/api';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

type BestOfWePublishTeaserProps = Omit<BuilderTeaserProps, 'teaser'> & {
  teaser: ArticleTeaser;
};

const PeerLogoWrapper = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  padding-right: ${({ theme }) => theme.spacing(1)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
  background-color: ${({ theme }) => theme.palette.common.white};
  width: ${({ theme }) => theme.spacing(6)};
  z-index: 1;

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: ${({ theme }) => theme.spacing(8)};
  }
`;

const LinkWrapper = styled(NextWepublishLink)`
  display: grid;
  grid-template-rows: auto;
  align-items: center;
  grid-template-columns: 1fr;
  padding-top: ${({ theme }) => theme.spacing(2)};
  padding-left: ${({ theme }) => theme.spacing(2)};
  position: relative;

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-top: ${({ theme }) => theme.spacing(4)};
    padding-left: ${({ theme }) => theme.spacing(4)};
  }
`;

const InnerContainer = styled('div')`
  position: relative;
  display: grid;
  align-content: space-between;
`;

const Content = styled('div')`
  line-height: 1.1;
  display: inline-block;
  margin: ${({ theme }) => theme.spacing(0.5)};
  position: absolute;
  bottom: 0;
  left: 0;

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin: ${({ theme }) => theme.spacing(2)};
  }
`;

const ContentElement = styled('div')`
  // no other way of doing it and maintining current design i.e. line clamp and box would make the white bg 100% wide
  max-height: 78px;
  overflow: hidden;

  ${({ theme }) => theme.breakpoints.up('md')} {
    max-height: 82.5px;
  }
`;

const ContentText = styled('span')`
  color: #2b2e34;
  background: ${({ theme }) => theme.palette.common.white};
  padding: 1px ${({ theme }) => theme.spacing(4)} 0.5px 0;
`;

const Title = styled(ContentText)`
  font-size: 14px;
  font-weight: 600;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 22px;
  }
`;

const Peer = styled(ContentText)`
  font-size: 12px;
  font-weight: 600;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 16px;
  }
`;

const teaserBackgroundStyles = css`
  aspect-ratio: 4/3;
  width: 100%;
  object-fit: cover;
`;

export const BestOfWePublishTeaser = ({
  teaser,
  alignment,
}: BestOfWePublishTeaserProps) => {
  const {
    elements: { Image },
  } = useWebsiteBuilder();

  const title = teaser && selectTeaserTitle(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';
  const image = teaser && selectTeaserImage(teaser);
  const peerName = teaser.article?.peer?.name;
  const peerLogo =
    teaser.article?.peer?.profile?.squareLogo ??
    teaser.article?.peer?.profile?.logo;

  return (
    <TeaserWrapper {...alignment}>
      <LinkWrapper
        color="inherit"
        underline="none"
        href={href}
        key={title}
      >
        <PeerLogoWrapper>
          {peerLogo && (
            <Image
              image={peerLogo}
              square
            />
          )}
        </PeerLogoWrapper>

        <InnerContainer>
          {image && (
            <Image
              image={image}
              css={teaserBackgroundStyles}
            />
          )}

          <Content>
            <ContentElement>
              <Title>{title}</Title>
            </ContentElement>

            <ContentElement>
              <Peer>by {peerName}</Peer>
            </ContentElement>
          </Content>
        </InnerContainer>
      </LinkWrapper>
    </TeaserWrapper>
  );
};
