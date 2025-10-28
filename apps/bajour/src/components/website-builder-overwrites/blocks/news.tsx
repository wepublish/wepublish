import styled from '@emotion/styled';
import { Box } from '@mui/material';
import {
  alignmentForTeaserBlock,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
  selectTeaserPreTitle,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  TeaserGridBlock,
  TeaserListBlock,
  useGetImagesByTagQuery,
} from '@wepublish/website/api';
import {
  BuilderTeaserListBlockProps,
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { MdEast } from 'react-icons/md';

export const isNewsTeasers = (
  block: BlockContent
): block is TeaserGridBlock | TeaserListBlock =>
  allPass([hasBlockStyle('News'), isTeaserListBlock])(block);

export const NewsBlockStyle = ({
  title,
  teasers,
  blockStyle,
  className,
}: Pick<
  BuilderTeaserListBlockProps,
  'teasers' | 'title' | 'blockStyle' | 'className'
>) => {
  const filledTeasers = teasers.filter(isFilledTeaser);
  const numColumns = 1;
  const {
    elements: { H2, Link, Image },
  } = useWebsiteBuilder();

  const { data: imagesData } = useGetImagesByTagQuery({
    variables: { tag: 'news-filler' },
  });

  const firstImage = imagesData?.getImagesByTag?.[0];

  return (
    <>
      <NewsTeaserListWrapper>
        <OrangeBox>
          <TeaserList>
            <H2 gutterBottom>{title}</H2>
            {filledTeasers.map((teaser, index) => (
              <NewsTeaser
                key={index}
                teaser={teaser}
                numColumns={numColumns}
                alignment={alignmentForTeaserBlock(index, numColumns)}
                blockStyle={blockStyle}
              />
            ))}
          </TeaserList>
          <Link
            href={'/a/tag/news'}
            style={{ textDecoration: 'none' }}
          >
            <b>Weitere Kurz-News &rarr;</b>
          </Link>
        </OrangeBox>

        <Filler>{firstImage && <Image image={firstImage} />}</Filler>
      </NewsTeaserListWrapper>
    </>
  );
};

const TeaserList = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Filler = styled(Box)``;

const OrangeBox = styled('div')`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.palette.secondary.contrastText};
  border-color: ${({ theme }) => theme.palette.primary.main};
  border-width: ${({ theme }) => theme.spacing(0.25)};
  border-style: solid;
  gap: ${({ theme }) => theme.spacing(1.5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(4.5)};
  }

  color: ${({ theme }) => theme.palette.text.secondary};

  > a {
    font-size: ${({ theme }) => theme.typography.h5.fontSize};
  }
`;

const NewsTeaserListWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing(2.5)};

  ${OrangeBox} {
    grid-column: span 3;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: span 2;
    }
  }

  ${Filler} {
    grid-column: span 3;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: span 1;
    }
  }
`;

const NewsTeaserUnstyled = ({
  teaser,
  alignment,
  className,
}: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const preTitle = teaser && selectTeaserPreTitle(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';

  const {
    elements: { H4, Link },
  } = useWebsiteBuilder();
  return (
    <Link
      href={href}
      className={className}
    >
      <span>{preTitle}</span>
      <div>
        <H4 gutterBottom>{title}</H4>
        <MdEast />
      </div>
    </Link>
  );
};

const NewsTeaser = styled(NewsTeaserUnstyled)`
  color: ${({ theme }) => theme.palette.text.primary};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(0)}`};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  text-decoration: none;

  * {
    font-size: 18px !important;
  }

  > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    :first-child {
      flex-grow: 1;
    }

    svg {
      min-width: 18px;
    }
  }

  > span {
    font-weight: 500;
  }

  h4 {
    font-weight: 300;
  }
`;
