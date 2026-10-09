import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

/* eslint-disable-next-line */
export interface DashboardProps {}

const StyledDashboard = styled.div`
  color: pink;
`;

export function Dashboard(props: DashboardProps) {
  const { t } = useTranslation();

  return (
    <StyledDashboard>
      <h1>{t('dashboard.welcome')}</h1>
    </StyledDashboard>
  );
}

export default Dashboard;
