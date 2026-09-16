import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { BuilderAuthorListItemProps, Link } from '@wepublish/website/builder';

const Card = styled(Link)`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-decoration: none;
  color: inherit;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  padding: 20px 24px;
  transition:
    border-color 0.15s,
    transform 0.15s;
  &:hover {
    border-color: ${({ theme }) => theme.palette.primary.main};
    transform: translateY(-2px);
  }
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
  margin: 0;
`;

export const EenewsAuthorListItem = ({
  className,
  name,
  jobTitle,
  url,
}: BuilderAuthorListItemProps) => {
  return (
    <Card
      className={className}
      href={url}
    >
      <Name variant="teaserTitle">{name}</Name>
      {jobTitle && <Role variant="teaserMeta">{jobTitle}</Role>}
    </Card>
  );
};
