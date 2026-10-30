import styled from '@emotion/styled';
import { IconButton } from '@mui/material';
import { PageTitle } from '@wepublish/ui/editor';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};

  &:empty {
    display: none;
  }
`;

export type WebsiteSettingsHeaderProps = PropsWithChildren<{
  title: string;
}>;

export function WebsiteSettingsHeader({
  title,
  children,
}: WebsiteSettingsHeaderProps) {
  const { t } = useTranslation();

  return (
    <Header>
      <Title>
        <IconButton
          component={RouterLink}
          to="/settings/website"
          title={t('websiteSettings.backToOverview')}
          aria-label={t('websiteSettings.backToOverview')}
        >
          <MdArrowBack />
        </IconButton>

        <PageTitle>{title}</PageTitle>
      </Title>

      <Actions>{children}</Actions>
    </Header>
  );
}
