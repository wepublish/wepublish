import styled from '@emotion/styled';
import {
  selectTeaserPreTitle,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BuilderTeaserProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdEast } from 'react-icons/md';

const NewsTeaserUnstyled = ({
  teaser,
  alignment,
  className,
}: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const preTitle = teaser && selectTeaserPreTitle(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';

  const {
    elements: { H4 },
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

export const NewsTeaser = styled(NewsTeaserUnstyled)`
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
    display: inline-block;
    font-weight: 500;
    line-height: 1.2;
  }

  h4 {
    font-weight: 300;
  }
`;
