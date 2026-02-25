import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { MdExtension } from 'react-icons/md';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Title = styled.h3`
  grid-column: -1/1;
`;

export function ExternalApps() {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <Title>{t('externalApps.apps')}</Title>
    </Wrapper>
  );
}
