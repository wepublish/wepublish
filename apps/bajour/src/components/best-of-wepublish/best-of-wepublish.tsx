import styled from '@emotion/styled';
import {
  alignmentForTeaserBlock,
  TeaserGridBlockWrapper,
} from '@wepublish/block-content/website';
import { ArticleTeaser } from '@wepublish/website/api';
import { BuilderTeaserGridBlockProps } from '@wepublish/website/builder';

import { BestOfWePublishTeaser } from './best-of-wepublish-teaser';

export const BestOfWePublishWrapper = styled('article')`
  grid-column: -1/1;
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  margin-top: ${({ theme }) => theme.spacing(4)};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const BestOfWePublishHeader = styled('div')`
  display: grid;
  grid-template-columns: max-content;
  color: ${({ theme }) => theme.palette.secondary.dark};
  background-color: currentColor;
  padding-left: 20%;
  font-size: 1.4rem;
  font-weight: bold;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 2rem;
  }
`;

const BestOfWePublishTeaserWrapper = styled(TeaserGridBlockWrapper)`
  grid-template-columns: 1fr 1fr;
`;

const HeaderText = styled('div')`
  text-transform: uppercase;
  background-color: ${({ theme }) => theme.palette.common.white};
  padding: 0 ${({ theme }) => theme.spacing(2)};
`;

const BestOfWePublishFooter = styled('div')`
  display: grid;
  padding-top: ${({ theme }) => theme.spacing(1)};
  padding-right: 5%;
  padding-bottom: ${({ theme }) => theme.spacing(3)};
  padding-left: calc(7% + ${({ theme }) => theme.spacing(4)});
  background: linear-gradient(
    to left,
    ${({ theme }) => theme.palette.secondary.dark}
      calc(93% - ${({ theme }) => theme.spacing(4)}),
    ${({ theme }) => theme.palette.common.white}
      calc(93% - ${({ theme }) => theme.spacing(4)}) 93%,
    ${({ theme }) => theme.palette.secondary.dark} 93%
  );
`;

const FooterContent = styled('div')`
  position: relative;
  font-weight: 300;
  padding-left: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-left: ${({ theme }) => theme.spacing(3)};
  }
`;

const WePublishEcosystem = styled('strong')`
  font-weight: 400;
`;

const MoreButton = styled('a')`
  position: absolute;
  bottom: 0;
  right: 0;
  transform: translateY(calc(50% + ${({ theme }) => theme.spacing(3)}));
  justify-self: end;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(3)};
  background-color: ${({ theme }) => theme.palette.common.white};
  border: 3px solid currentColor;
  color: ${({ theme }) => theme.palette.secondary.dark};
  border-radius: ${({ theme }) => theme.spacing(1)};
  font-size: 20px;
  text-decoration: none;
  font-weight: 500;

  ${({ theme }) => theme.breakpoints.up('md')} {
    border-radius: ${({ theme }) => theme.spacing(2)};
    padding: ${({ theme }) => theme.spacing(2)}
      ${({ theme }) => theme.spacing(5)};
    font-size: 27px;
  }
`;

export const BestOfWePublish = ({
  teasers,
  numColumns,
  blockStyle,
}: BuilderTeaserGridBlockProps) => {
  const filteredTeasers = teasers.filter(
    (teaser): teaser is ArticleTeaser =>
      teaser?.__typename === 'ArticleTeaser' && Boolean(teaser.article?.peerId)
  );

  return (
    <BestOfWePublishWrapper>
      <BestOfWePublishHeader>
        <HeaderText>Best of We.Publish</HeaderText>
      </BestOfWePublishHeader>

      <BestOfWePublishTeaserWrapper numColumns={numColumns}>
        {filteredTeasers.map(
          (teaser, index) =>
            teaser && (
              <BestOfWePublishTeaser
                key={index}
                teaser={teaser}
                numColumns={numColumns}
                index={index}
                alignment={alignmentForTeaserBlock(index, numColumns)}
                blockStyle={blockStyle}
              />
            )
        )}
      </BestOfWePublishTeaserWrapper>

      <BestOfWePublishFooter>
        <FooterContent>
          <WePublishEcosystem>
            We.Publish – Ökosystem für Schweizer Medien
          </WePublishEcosystem>
          <div>
            Die We.Publish Foundation fördert unabhängige journalistische
          </div>
          <div>Angebote und die Medienvielfalt in der Schweiz.</div>

          <MoreButton
            href="https://wepublish.ch/"
            target="_blank"
          >
            Mehr zu We.Publish
          </MoreButton>
        </FooterContent>
      </BestOfWePublishFooter>
    </BestOfWePublishWrapper>
  );
};
