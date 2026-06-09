import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { BuilderAuthorListItemProps, Link } from '@wepublish/website/builder';

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-decoration: none;
  color: inherit;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  padding: 24px;
  transition:
    border-color 0.15s,
    transform 0.15s;
  &:hover {
    border-color: ${({ theme }) => theme.palette.primary.main};
    transform: translateY(-2px);
  }
`;

const Avatar = styled('div')`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ theme }) => theme.palette.secondary.main};
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.palette.primary.main};
  flex-shrink: 0;
`;

const Initials = styled(Typography)`
  display: block;
`;

const Name = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
  margin: 0;
`;

const Role = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
  opacity: 0.7;
  margin-top: 2px;
`;

const Bio = styled(Typography)`
  display: -webkit-box;
  color: ${({ theme }) => theme.palette.text.primary};
  margin: 8px 0 0;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const bioToText = (bio: unknown): string => {
  if (!Array.isArray(bio)) {
    return '';
  }
  return bio
    .map(node => {
      if (typeof node !== 'object' || node === null) {
        return '';
      }
      const children = (node as { children?: Array<{ text?: string }> })
        .children;
      if (!Array.isArray(children)) {
        return '';
      }
      return children.map(c => c.text ?? '').join('');
    })
    .join(' ')
    .trim();
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

export const EenewsAuthorListItem = ({
  className,
  name,
  jobTitle,
  bio,
  url,
}: BuilderAuthorListItemProps) => {
  return (
    <Card
      className={className}
      href={url}
    >
      <Avatar>
        <Initials variant="teaserTitle">{initials(name)}</Initials>
      </Avatar>
      <div>
        <Name variant="teaserTitle">{name}</Name>
        {jobTitle && <Role variant="teaserMeta">{jobTitle}</Role>}
      </div>
      <Bio variant="teaserExcerpt">{bioToText(bio)}</Bio>
    </Card>
  );
};
