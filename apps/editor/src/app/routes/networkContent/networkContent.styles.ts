import styled from '@emotion/styled';
import { Typography } from '@mui/material';

export const ScrollContainer = styled('div')`
  max-height: 600px;
  overflow-y: auto;
`;

export const FeedList = styled('div')`
  display: flex;
  flex-direction: column;
`;

export const ArticleRow = styled('div')`
  display: grid;
  grid-template-columns: 140px 1fr 120px;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(1.5)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

export const ArticleLink = styled('a')`
  text-decoration: none;
  color: inherit;
  display: contents;

  &:hover,
  &:focus,
  &:active {
    text-decoration: none;
  }
`;

export const ArticleImage = styled('img')`
  width: 140px;
  height: 90px;
  object-fit: cover;
  display: block;
  border-radius: 2px;
`;

export const ImagePlaceholder = styled('div')`
  width: 140px;
  height: 90px;
  background: ${({ theme }) => theme.palette.action.disabledBackground};
  border-radius: 2px;
`;

export const ContentArea = styled('div')`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
`;

export const ArticleTitle = styled(Typography)`
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.3;
  color: ${({ theme }) => theme.palette.text.primary};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

export const ArticleLead = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 0.78rem;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-top: ${({ theme }) => theme.spacing(0.25)};
`;

export const MetaLine = styled(Typography)`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.palette.text.disabled};
  margin-top: ${({ theme }) => theme.spacing(0.5)};
`;

export const ActionColumn = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

export const PublisherName = styled(Typography)`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.palette.text.primary};
  text-align: center;
  line-height: 1.2;
`;

export const CenteredContainer = styled('div')`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(4)};
`;

export const PageGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(2)};
  height: calc(100vh - 160px);
`;

export const PanelColumn = styled('div')`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
`;

export const FilterBar = styled('div')`
  display: grid;
  grid-template-columns: 1fr 160px 160px 160px;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(1.5)} 0;
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${({ theme }) => theme.palette.background.paper};
`;

export const ClientCard = styled('div')`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(1.5)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

export const ClientName = styled(Typography)`
  font-weight: 700;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;

export const ClientUrl = styled(Typography)`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.palette.text.secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SectionTitle = styled(Typography)`
  font-weight: 700;
  font-size: 1rem;
  padding-bottom: ${({ theme }) => theme.spacing(1)};
  border-bottom: 2px solid ${({ theme }) => theme.palette.divider};
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

export const ClientUserInfo = styled(Typography)`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.palette.text.disabled};
  line-height: 1.4;
`;

export const PaginationBar = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1.5)} 0;
`;
