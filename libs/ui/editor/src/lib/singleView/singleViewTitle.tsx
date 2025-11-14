import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { MdChevronLeft } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, Col, FlexboxGrid, Loader as RLoader, Row } from 'rsuite';

const ChevronLeft = styled(MdChevronLeft)`
  font-size: 48px;
`;

const FlexGrid = styled(FlexboxGrid)`
  padding-right: 5px;
  padding-bottom: 20px;
`;

const FlexboxItem = styled(FlexboxGrid.Item)`
  margin-left: 40px;
`;

const Loader = styled(RLoader)`
  margin-right: 5px;
`;

const SaveButton = styled(Button)`
  margin-right: 10px;
`;

const PaddedCol = styled(Col)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-top: 3px;
  margin-right: 1rem;
`;

const FlexRow = styled(Row)`
  display: flex;
  align-items: center;
`;

const FlexLink = styled(Link)`
  display: flex;
`;

const Heading = styled.h1`
  font-size: 36px;
  line-height: 50px;
`;

interface SingleViewTitleProps {
  title?: string;
  loading: boolean;
  loadingTitle?: string;
  saveBtnTitle: string;
  saveAndCloseBtnTitle: string;
  closePath: string;
  additionalMenu?: ReactNode;
  setCloseFn(close: boolean): void;
}

export function SingleViewTitle({
  title,
  loading,
  loadingTitle,
  saveBtnTitle,
  saveAndCloseBtnTitle,
  closePath,
  additionalMenu,
  setCloseFn,
}: SingleViewTitleProps) {
  /**
   * UI helpers
   */
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

  function actionsView() {
    return (
      <>
        {/* save button */}
        <SaveButton
          appearance="ghost"
          loading={loading}
          type="submit"
          data-testid="saveButton"
        >
          {saveBtnTitle}
        </SaveButton>
        {/* save and close button */}
        <Button
          appearance="primary"
          loading={loading}
          type="submit"
          data-testid="saveAndCloseButton"
          onClick={() => setCloseFn(true)}
        >
          {saveAndCloseBtnTitle}
        </Button>
      </>
    );
  }

  return (
    <FlexGrid align="middle">
      {/* title */}
      <FlexboxGrid.Item colspan={12}>
        <FlexboxGrid align="middle">
          <FlexRow>
            <PaddedCol xs={29}>
              <FlexLink to={closePath}>
                <ChevronLeft />
              </FlexLink>
              <Heading>{titleView()}</Heading>
            </PaddedCol>
          </FlexRow>
        </FlexboxGrid>
      </FlexboxGrid.Item>

      {/* actions */}
      <FlexboxGrid.Item colspan={12}>
        <FlexboxGrid
          justify="end"
          align="middle"
        >
          {/* additional menu content */}
          <FlexboxGrid.Item>{additionalMenu}</FlexboxGrid.Item>

          {/* save btns */}
          <FlexboxItem>{actionsView()}</FlexboxItem>
        </FlexboxGrid>
      </FlexboxGrid.Item>
    </FlexGrid>
  );
}
