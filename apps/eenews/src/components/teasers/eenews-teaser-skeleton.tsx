import styled from '@emotion/styled';
import { Theme } from '@mui/material';

const shimmer = (theme: Theme) =>
  `${theme.palette.background.skeleton} url('/skeleton.gif') center / cover no-repeat`;

const Card = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ImageFrame = styled('div')`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: ${({ theme }) => shimmer(theme)};
`;

const Lines = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Bar = styled('span', {
  shouldForwardProp: p => p !== 'w' && p !== 'h',
})<{ w: string; h: number }>`
  display: block;
  width: ${({ w }) => w};
  height: ${({ h }) => h}px;
  border-radius: 3px;
  background: ${({ theme }) => shimmer(theme)};
`;

export const EenewsTeaserSkeleton = ({ className }: { className?: string }) => (
  <Card
    className={className}
    aria-hidden
  >
    <ImageFrame />
    <Lines>
      <Bar
        w="40%"
        h={14}
      />
      <Bar
        w="92%"
        h={26}
      />
      <Bar
        w="68%"
        h={26}
      />
      <Bar
        w="100%"
        h={16}
      />
      <Bar
        w="84%"
        h={16}
      />
    </Lines>
  </Card>
);
