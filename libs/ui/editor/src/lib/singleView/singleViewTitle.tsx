import styled from '@emotion/styled';
import { Button, CircularProgress } from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdChevronLeft } from 'react-icons/md';

import { Link } from '../atoms';
import { PageTitle } from '../atoms/pageTitle';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';

const ChevronLeft = styled(MdChevronLeft)`
  font-size: 32px;
`;

const Grid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: center;
  justify-items: start;
  gap: 40px;
  margin-bottom: 20px;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const PaddedCol = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const FlexLink = styled(Link)`
  display: flex;
`;

interface SingleViewTitleProps {
  title?: string;
  children?: ReactNode;
  disabled?: boolean;
  loading: boolean;
  loadingTitle?: string;
  saveBtnTitle: string;
  saveAndCloseBtnTitle: string;
  closePath: string;
  setCloseFn(close: boolean): void;
}

export function SingleViewTitle({
  title,
  children,
  disabled,
  loading,
  loadingTitle,
  saveBtnTitle,
  saveAndCloseBtnTitle,
  closePath,
  setCloseFn,
}: SingleViewTitleProps) {
  const { t } = useTranslation();

  function titleView() {
    if (loading) {
      return (
        <>
          <CircularProgress />
          {loadingTitle ?? title}
        </>
      );
    }

    return title;
  }

  return (
    <Grid>
      <PaddedCol>
        <IconButtonTooltip caption={t('back')}>
          <FlexLink
            to={closePath}
            aria-label={t('back')}
          >
            <ChevronLeft />
          </FlexLink>
        </IconButtonTooltip>

        <PageTitle>{titleView()}</PageTitle>
      </PaddedCol>

      <Actions>
        {children}

        <Button
          variant="outlined"
          loading={loading}
          disabled={disabled}
          type="submit"
          data-testid="saveButton"
        >
          {saveBtnTitle}
        </Button>

        <Button
          variant="contained"
          loading={loading}
          disabled={disabled}
          type="submit"
          data-testid="saveAndCloseButton"
          onClick={() => setCloseFn(true)}
        >
          {saveAndCloseBtnTitle}
        </Button>
      </Actions>
    </Grid>
  );
}
