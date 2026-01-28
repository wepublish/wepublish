import styled from '@emotion/styled';
import { ArticleWrapper } from '@wepublish/article/website';
import { Image } from '@wepublish/image/website';
import { Link } from '@wepublish/ui';
import { BuilderAuthor, useWebsiteBuilder } from '@wepublish/website/builder';
import { useMemo } from 'react';

const TsriAdvertiserContainer = styled(Link)`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
  border-bottom: solid 1px ${({ theme }) => theme.palette.primary.main};
  text-decoration: none;
  color: ${({ theme }) => theme.palette.common.black};
`;
const TsriAdvertiserImgContainer = styled('div')`
  padding-bottom: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(1)};
`;

const AdImage = styled(Image)`
  max-height: 100px;
  max-width: 100px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    max-height: 120px;
    max-width: 120px;
  }
`;

const TsriAdvertiserContent = styled('div')``;

const SPONSOR_TAG = 'sponsor';
const PROMO_TAG = 'promo';

function isPromo(author: BuilderAuthor): boolean {
  return !!author.tags?.find(tag => tag.tag === PROMO_TAG);
}

function isSponsor(author: BuilderAuthor): boolean {
  return !!author.tags?.find(tag => tag.tag === SPONSOR_TAG);
}

function getFirstLink(author: BuilderAuthor): string {
  const links = author.links;
  return links?.length ? links[0].url : '';
}

export default function TsriAdHeader({
  authors,
}: {
  authors?: BuilderAuthor[];
}) {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const advertisers = useMemo(
    () => authors?.filter(author => isSponsor(author) || isPromo(author)),
    [authors]
  );

  if (!advertisers?.length) {
    return;
  }

  return (
    <ArticleWrapper>
      {advertisers?.map(advertiser => (
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
    </ArticleWrapper>
  );
}
