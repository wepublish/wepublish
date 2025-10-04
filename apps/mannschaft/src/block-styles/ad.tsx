import styled from '@emotion/styled';
import {
  hasBlockStyle,
  isTeaserListBlock,
  TeaserListBlock,
  TeaserListBlockTeasers,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  CustomTeaser,
  Teaser,
  TeaserListBlock as TeaserListBlockType,
  TeaserType,
} from '@wepublish/website/api';
import { BuilderTeaserListBlockProps } from '@wepublish/website/builder';
import { allPass, compose, insert } from 'ramda';

const first = hasBlockStyle('1st Teaser Ad');
const second = hasBlockStyle('2nd Teaser Ad');
const third = hasBlockStyle('3rd Teaser Ad');

export const isFirstAdTeaser = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserListBlockType => allPass([first, isTeaserListBlock])(block);

export const isSecondAdTeaser = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserListBlockType => allPass([second, isTeaserListBlock])(block);

export const isThirdAdTeaser = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserListBlockType => allPass([third, isTeaserListBlock])(block);

// This allows the ad slot to not create an empty space when not displayed
const AdTeaserList = styled(TeaserListBlock)`
  ${TeaserListBlockTeasers} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  ${TeaserListBlockTeasers} > * {
    grid-column: initial;
    grid-row: initial;

    &:empty {
      display: none;
    }
  }
`;

export const AdTeaserBlockStyle = (props: BuilderTeaserListBlockProps) => {
  // prettier-ignore
  const position = first(props)
    ? 0
    : second(props)
      ? 1
      : 2

  const teasers = compose(
    insert<Teaser>(position, {
      __typename: 'CustomTeaser',
      type: TeaserType.Custom,
      properties: [],
      contentUrl: null,
      openInNewTab: false,
      preTitle: 'ad-300x250',
      title: null,
      lead: null,
      image: null,
    } as CustomTeaser)
  )(props.teasers as Teaser[]);

  return (
    <AdTeaserList
      {...props}
      teasers={teasers}
    />
  );
};
