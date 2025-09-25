import styled from '@emotion/styled';
import { css } from '@mui/material';
import { RichTextBlock } from '@wepublish/block-content/website';
import { Button } from '@wepublish/ui';
import { memo, useState } from 'react';
import { MdInfoOutline } from 'react-icons/md';
import { Descendant } from 'slate';

interface InfoBoxProps {
  richText: Descendant[];
  className?: string;
}

export const InfoBoxWrapper = styled('aside')<{ expanded: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing(1)};
  height: ${({ theme }) => theme.spacing(28)};
  interpolate-size: allow-keywords;
  transition: height 0.3s ease;
  background-color: ${({ theme }) => theme.palette.common.white};
  padding: ${({ theme }) => theme.spacing(1.5)};
  border-radius: ${({ theme }) => theme.spacing(2.5)};

  ${({ expanded }) =>
    expanded &&
    css`
      height: auto;
    `}
`;

const AllAbout = styled('div')`
  color: ${({ theme }) => theme.palette.common.black};
  font-size: 17px;
  font-weight: ${({ theme }) => theme.typography.fontWeightBold};
  margin-left: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      font-size: 21px;
    }
  `}

  ${({ theme }) => css`
    ${theme.breakpoints.up('xl')} {
      font-size: 24px;
    }
  `}
`;

const RichTextBlockWrapper = styled('div')<{ expanded: boolean }>`
  height: ${({ theme }) => theme.spacing(14)};
  overflow: hidden;
  interpolate-size: allow-keywords;
  transition: height 0.3s ease-in-out;
  span {
    font-weight: 300;
  }

  ${({ theme, expanded }) =>
    expanded &&
    css`
      height: auto;
    `}
`;

const InfoBoxInfo = styled('div')`
  color: ${({ theme }) => theme.palette.common.black};
  grid-column: 1/3;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding-top: ${({ theme }) => theme.spacing(0.5)};
`;

const IconWrapper = styled('div')`
  width: ${({ theme }) => theme.spacing(3)};
  height: ${({ theme }) => theme.spacing(3)};
`;

const InfoBoxContent = styled('div')`
  display: grid;
  grid-column: 1/3;
`;

const ReadMore = styled(Button)`
  margin: ${({ theme }) => theme.spacing(1.5)} auto 0;
  padding: ${({ theme }) => theme.spacing(0.5)}
    ${({ theme }) => theme.spacing(1.5)};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 300;
  font-size: 10px;
  color: ${({ theme }) => theme.palette.common.black};
  border: 1px solid ${({ theme }) => theme.palette.common.black};
  background-color: transparent;
  transition: background-color 0.25s ease-in-out;
  width: fit-content;

  :hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
`;

export const InfoBox = memo(function InfoBox({
  richText,
  className,
}: InfoBoxProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <InfoBoxWrapper
      expanded={expanded}
      className={className}
    >
      <InfoBoxInfo>
        <IconWrapper>
          <MdInfoOutline size="24" />
        </IconWrapper>
        <AllAbout>Darum geht’s</AllAbout>
      </InfoBoxInfo>

      <InfoBoxContent>
        <RichTextBlockWrapper expanded={expanded}>
          <RichTextBlock richText={richText} />
        </RichTextBlockWrapper>

        <ReadMore onClick={() => setExpanded(expanded => !expanded)}>
          {expanded ? 'Weniger' : 'alles lesen'}
        </ReadMore>
      </InfoBoxContent>
    </InfoBoxWrapper>
  );
});
