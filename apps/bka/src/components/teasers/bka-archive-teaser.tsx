import styled from '@emotion/styled';
import {
  selectTeaserImage,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { BuilderTeaserProps, Image, Link } from '@wepublish/website/builder';
import { FaUpRightFromSquare } from 'react-icons/fa6';

export const BkaArchiveTeaserPanel = styled('div')`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(0.5, 1, 1)};
  background-color: ${({ theme }) => theme.palette.background.default};
`;

export const BkaArchiveTeaserWrapper = styled('div')`
  position: relative;
  overflow: hidden;
  height: 100%;
  padding: ${({ theme }) => theme.spacing(1, 1, 0.5)};
  background-color: ${({ theme }) => theme.palette.background.default};

  &:hover,
  &:focus-within {
    z-index: 20;
    overflow: visible;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  }
`;

export const BkaArchiveTeaserImage = styled(Image)`
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 10 / 7;
  object-fit: cover;
`;

export const BkaArchiveTeaserLabel = styled('div')`
  margin-top: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  border-top: 1.5px solid currentColor;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  font-weight: 700;
  line-height: 1.5;
`;

export const BkaArchiveTeaserAction = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: 2px ${({ theme }) => theme.spacing(1)};
  border: 1px solid ${({ theme }) => theme.palette.common.black};
  border-radius: 4px;
  background-color: ${({ theme }) => theme.palette.background.default};
  color: ${({ theme }) => theme.palette.text.primary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  font-weight: 700;
  line-height: 1.5;
  text-decoration: none;

  & > svg {
    flex-shrink: 0;
    width: 15px;
    height: 14px;
  }
`;

export const BkaArchiveTeaser = ({ teaser, className }: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const image = teaser && selectTeaserImage(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';

  return (
    <BkaArchiveTeaserWrapper className={className}>
      {image && <BkaArchiveTeaserImage image={image} />}

      <BkaArchiveTeaserLabel>{title}</BkaArchiveTeaserLabel>

      <BkaArchiveTeaserPanel>
        <BkaArchiveTeaserAction
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open file
          <FaUpRightFromSquare />
        </BkaArchiveTeaserAction>
      </BkaArchiveTeaserPanel>
    </BkaArchiveTeaserWrapper>
  );
};
