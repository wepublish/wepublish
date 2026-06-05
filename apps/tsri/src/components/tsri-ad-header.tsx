import styled from '@emotion/styled';
import { alpha } from '@mui/material';
import { ArticleWrapper } from '@wepublish/article/website';
import { Image } from '@wepublish/image/website';
import { Link } from '@wepublish/ui';
import { FullAuthorFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { isPromo, useAdvertisers } from '../hooks/use-advertisers';

const PromoArticleBeforeWrapper = styled(ArticleWrapper)`
  grid-template-columns: var(--two-column-grid) !important;
  padding: ${({ theme }) => theme.spacing(1, 0, 0, 0)};
  margin: ${({ theme }) => theme.spacing(0, 0, -8, 0)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(5, 0, 0, 0)};
    margin: ${({ theme }) => theme.spacing(0, 0, -10, 0)};
  }
`;

const TsriAdvertiserContainer = styled(Link)`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
  text-decoration: none;
  color: ${({ theme }) => theme.palette.common.black};
  grid-column: 1 / 2;
`;

const TsriAdvertiserImgContainer = styled('div')`
  padding-bottom: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(1)};
`;

const AdImage = styled(Image)`
  max-height: 100px;
  max-width: 100px;
  border-radius: 99999px;
  border: 1px solid ${({ theme }) => alpha(theme.palette.common.black, 0.2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    max-height: 120px;
    max-width: 120px;
  }
`;

const TsriAdvertiserContent = styled('div')``;

function getFirstLink(author: FullAuthorFragment): string {
  const links = author.links;
  return links?.length ? links[0].url : '';
}

export default function TsriAdHeader({
  authors,
}: {
  authors?: FullAuthorFragment[];
}) {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const advertisers = useAdvertisers(authors);

  if (!advertisers?.length) {
    return;
  }

  return (
    <PromoArticleBeforeWrapper>
      {advertisers?.map((advertiser: FullAuthorFragment) => (
        <TsriAdvertiserContainer
          key={advertiser.id}
          href={getFirstLink(advertiser)}
          target={'_blank'}
        >
          {advertiser.image && (
            <TsriAdvertiserImgContainer>
              <AdImage image={advertiser.image} />
            </TsriAdvertiserImgContainer>
          )}

          <TsriAdvertiserContent>
            {isPromo(advertiser) ?
              <strong>Rubrik Kultur wird präsentiert von: </strong>
            : <strong>Präsentiert von:</strong>}

            <RichText richText={advertiser.bio || []} />
          </TsriAdvertiserContent>
        </TsriAdvertiserContainer>
      ))}
    </PromoArticleBeforeWrapper>
  );
}
