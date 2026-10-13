import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { MdChevronLeft } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, Loader as RLoader } from 'rsuite';

import { IconButtonTooltip } from '../atoms/iconButtonTooltip';

const ChevronLeft = styled(MdChevronLeft)`
  font-size: 48px;

  @media (max-width: 640px) {
    font-size: 32px;
  }
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

const Loader = styled(RLoader)`
  margin-right: 4px;
`;

const SaveButton = styled(Button)`
  margin-right: 8px;
`;

const PaddedCol = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-top: 3px;
  margin-right: 1rem;
`;

const FlexLink = styled(Link)`
  display: flex;
`;

const Heading = styled.h1`
  font-size: var(--rs-heading-h1-font-size, 36px);
  line-height: var(--rs-heading-h1-line-height, 50px);
  overflow-wrap: anywhere;
`;

interface SingleViewTitleProps {
  title?: string;
  loading: boolean;
  loadingTitle?: string;
  saveBtnTitle: string;
  saveAndCloseBtnTitle: string;
  closePath: string;
  setCloseFn(close: boolean): void;
}

export function SingleViewTitle({
  title,
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
          <Loader />
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

        <Heading>{titleView()}</Heading>
      </PaddedCol>

      <div>
        <SaveButton
          appearance="ghost"
          loading={loading}
          type="submit"
          data-testid="saveButton"
        >
          {saveBtnTitle}
        </SaveButton>

        <Button
          appearance="primary"
          loading={loading}
          type="submit"
          data-testid="saveAndCloseButton"
          onClick={() => setCloseFn(true)}
        >
          {saveAndCloseBtnTitle}
        </Button>
      </div>
    </Grid>
  );
}
