import styled from '@emotion/styled';

export const ScrollContainer = styled('div')`
  max-height: 600px;
  overflow-y: auto;
`;

export const PageGrid = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  align-items: start;
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Card = styled('section')`
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius + 'px'};
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
`;

export const CardHeader = styled('header')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.vars.palette.divider};

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: ${({ theme }) => theme.vars.palette.text.primary};
  }
`;

export const CardCount = styled('span')`
  font-size: 13px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

export const CardFooter = styled('div')`
  display: flex;
  justify-content: center;
  padding: 12px 20px;
  border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
`;

export const FilterBar = styled('div')`
  display: grid;
  grid-template-columns:
    minmax(200px, 1fr) minmax(160px, 220px)
    repeat(2, minmax(140px, 170px));
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.vars.palette.divider};

  > * {
    min-width: 0;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    > :first-of-type {
      grid-column: 1 / -1;
    }
  }
`;

export const FeedList = styled('div')`
  display: flex;
  flex-direction: column;
`;

export const ArticleRow = styled('div')`
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
  }

  @media (max-width: 640px) {
    grid-template-columns: 88px minmax(0, 1fr);

    > :last-child {
      display: flex;
      grid-column: 1 / -1;
      align-items: center;
      justify-content: space-between;
      min-width: 0;
      text-align: left;
    }
  }
`;

export const ArticleLink = styled('a')`
  text-decoration: none;
  color: inherit;
  display: block;
  min-width: 0;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};

  &:hover,
  &:focus,
  &:active {
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 2px;
  }
`;

export const ArticleImage = styled('img')`
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
`;

export const ImagePlaceholder = styled('div')`
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

export const ContentArea = styled('div')`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

const clamped = `
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

export const ArticleTitle = styled('span')`
  ${clamped}
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  color: ${({ theme }) => theme.vars.palette.text.primary};
`;

export const ArticleLead = styled('span')`
  ${clamped}
  font-size: 13px;
  line-height: 1.45;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

export const MetaLine = styled('span')`
  font-size: 12px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

export const ActionColumn = styled('div')`
  display: grid;
  justify-items: end;
  gap: 8px;
  min-width: 140px;
  text-align: right;
`;

export const PublisherName = styled('span')`
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: ${({ theme }) => theme.vars.palette.text.primary};
`;

export const ConnectedBadge = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  background-color: rgb(
    from ${({ theme }) => theme.vars.palette.success.main} r g b / 12%
  );
  color: ${({ theme }) => theme.vars.palette.success.main};
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
`;

export const CenteredContainer = styled('div')`
  display: flex;
  justify-content: center;
  padding: 32px 20px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  text-align: center;
`;

export const ErrorText = styled('span')`
  color: ${({ theme }) => theme.vars.palette.error.main};
`;

export const ClientCard = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
  }
`;

export const ClientName = styled('div')`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.vars.palette.text.primary};
`;

export const ClientUserInfo = styled('div')`
  overflow: hidden;
  font-size: 12px;
  line-height: 1.4;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  text-overflow: ellipsis;
  white-space: nowrap;
`;
