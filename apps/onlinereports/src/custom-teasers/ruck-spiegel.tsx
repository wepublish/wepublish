import styled from '@emotion/styled';
import {
  selectTeaserLead,
  TeaserWrapper,
} from '@wepublish/block-content/website';
import { ArticleTeaser } from '@wepublish/website/api';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { BlueBox } from '../components/blue-box';

export const isRuckSpiegelTeaser = allPass([
  ({ teaser }: BuilderTeaserProps) => teaser?.__typename === 'ArticleTeaser',
  ({ teaser }: BuilderTeaserProps) =>
    !!(teaser as ArticleTeaser).article?.tags
      .map(t => t.tag)
      .includes('RückSpiegel'),
]);

const RuckSpiegelTeaserWrapper = styled(TeaserWrapper)`
  height: 100%;
`;

export const RuckSpiegelTeaser = ({
  teaser,
  alignment,
  className,
}: BuilderTeaserProps) => {
  return (
    <RuckSpiegelTeaserWrapper {...alignment}>
      <BlueBox>
        <RuckSpiegelTeaserContent
          teaser={teaser}
          className={className}
        />
      </BlueBox>
    </RuckSpiegelTeaserWrapper>
  );
};

const RuckSpiegelUnstyled = ({
  teaser,
  className,
}: Pick<BuilderTeaserProps, 'className' | 'teaser'>) => {
  const lead = teaser && selectTeaserLead(teaser);
  const {
    elements: { H4 },
  } = useWebsiteBuilder();

  return (
    <div className={className}>
      <H4 gutterBottom>{lead}</H4>
    </div>
  );
};

export const RuckSpiegelTeaserContent = styled(RuckSpiegelUnstyled)`
  color: ${({ theme }) => theme.palette.text.primary};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(0)}`};

  text-decoration: none;

  &:not(:first-of-type:last-of-type) {
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  }

  * {
    font-size: 18px !important;
  }

  > span {
    font-weight: 500;
  }

  h4 {
    font-weight: 300;
  }
`;
