import styled from '@emotion/styled';
import { useExternalAppsQuery } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { ExternalAppForm } from './addExternalAppForm';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Title = styled.h3`
  grid-column: -1/1;
`;

export function ExternalApps() {
  const { t } = useTranslation();
  const { data } = useExternalAppsQuery();

  return (
    <Wrapper>
      <Title>{t('externalApps.apps')}</Title>

      {data?.externalApps?.map(app => (
        <ExternalAppForm
          key={app.id}
          app={app}
        />
      ))}

      <ExternalAppForm />
    </Wrapper>
  );
}
