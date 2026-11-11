import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { ExternalAppsDocument } from '@wepublish/editor/api';
import {
  InfoTooltip,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { ExternalAppForm } from './externalAppForm';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 440px), 1fr));
  gap: 24px;
  align-items: start;
`;

export function ExternalApps() {
  const { t } = useTranslation();
  const { data } = useQuery(ExternalAppsDocument);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>
            {t('externalApps.apps')}{' '}
            <InfoTooltip text={t('externalApps.appsInfo')} />
          </PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      <Wrapper>
        {data?.externalApps?.map(app => (
          <ExternalAppForm
            key={app.id}
            app={app}
          />
        ))}

        <ExternalAppForm />
      </Wrapper>
    </>
  );
}
