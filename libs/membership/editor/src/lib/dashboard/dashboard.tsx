import { Typography } from '@mui/material';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

const StyledDashboard = styled.div`
  color: pink;
`;

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <StyledDashboard>
      <Typography variant="h1">{t('dashboard.welcome')}</Typography>
    </StyledDashboard>
  );
}

export default Dashboard;
