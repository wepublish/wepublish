import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';
import {
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';

// Alternates between blue and yellow based on teaser index
const getBgColor = (index: number) => (index % 2 === 0 ? '#0800ff' : '#f5ff64');

const getTextColor = (index: number) =>
  index % 2 === 0 ? '#ffffff' : '#000000';

const getButtonVariant = (index: number): 'cta-yellow' | 'cta-black' =>
  index % 2 === 0 ? 'cta-yellow' : 'cta-black';

const MonoCard = styled('a')<{ bgColor: string; textColor: string }>`
  display: grid;
  grid-template-rows: 1fr auto auto;
  text-decoration: none;
  color: ${({ textColor }) => textColor};
  background-color: ${({ bgColor }) => bgColor};
  padding: ${({ theme }) => theme.spacing(3)};
  gap: ${({ theme }) => theme.spacing(2)};
  min-height: 200px;
  transition: opacity 200ms ease;

  &:hover {
    opacity: 0.9;
  }
`;

const MonoTitle = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: clamp(1rem, 2.5vw, 1.35rem);
  line-height: 1.2;
`;

const MonoLead = styled(Typography)`
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.85;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const ReflektTeaserMono = ({
  teaser,
  index = 0,
  className,
}: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const href = teaser && selectTeaserUrl(teaser);

  if (!teaser || !href) {
    return null;
  }

  const bgColor = getBgColor(index);
  const textColor = getTextColor(index);
  const buttonVariant = getButtonVariant(index);

  return (
    <MonoCard
      href={href}
      className={className}
      bgColor={bgColor}
      textColor={textColor}
    >
      <div>
        {title && <MonoTitle>{title}</MonoTitle>}
        {lead && <MonoLead>{lead}</MonoLead>}
      </div>

      <Button
        variant={buttonVariant}
        size="small"
        tabIndex={-1}
        sx={{ width: 'fit-content', fontSize: '0.8rem', padding: '6px 20px' }}
      >
        Weiterlesen
      </Button>
    </MonoCard>
  );
};
