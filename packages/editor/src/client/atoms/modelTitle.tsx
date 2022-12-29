import styled from '@emotion/styled'
import React, {ReactChild} from 'react'
import {MdChevronLeft} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {Button, Col, FlexboxGrid, Loader, Row} from 'rsuite'

const StyledCol = styled(Col)`
  padding-top: 3px;
`

const StyledFlexboxGrid = styled(FlexboxGrid)`
  padding-right: 5px;
  padding-bottom: 20px;
`

const StyledFlexboxItem = styled(FlexboxGrid.Item)`
  margin-left: 40px;
`

const StyledLoader = styled(Loader)`
  margin-right: 5px;
`

const StyledSaveButton = styled(Button)`
  margin-right: 10px;
`

interface modelTitleProps {
  title?: string
  loading: boolean
  loadingTitle: string
  saveBtnTitle: string
  saveAndCloseBtnTitle: string
  closePath: string
  additionalMenu?: ReactChild
  setCloseFn(close: boolean): void
}

export function ModelTitle({
  title,
  loading,
  loadingTitle,
  saveBtnTitle,
  saveAndCloseBtnTitle,
  closePath,
  additionalMenu,
  setCloseFn
}: modelTitleProps) {
  /**
   * UI helpers
   */
  function titleView() {
    if (loading) {
      return (
        <>
          <StyledLoader />
          {loadingTitle}
        </>
      )
    }
    return title
  }

  function actionsView() {
    return (
      <>
        {/* save button */}
        <StyledSaveButton
          appearance="ghost"
          loading={loading}
          type="submit"
          data-testid="saveButton">
          {saveBtnTitle}
        </StyledSaveButton>
        {/* save and close button */}
        <Button
          appearance="primary"
          loading={loading}
          type="submit"
          data-testid="saveAndCloseButton"
          onClick={() => setCloseFn(true)}>
          {saveAndCloseBtnTitle}
        </Button>
      </>
    )
  }

  return (
    <>
      <StyledFlexboxGrid align="middle">
        {/* title */}
        <FlexboxGrid.Item colspan={12}>
          <Row>
            <StyledCol xs={2}>
              <Link to={closePath}>
                <h1>
                  <MdChevronLeft />
                </h1>
              </Link>
            </StyledCol>
            <Col xs={16}>
              <h2>{titleView()}</h2>
            </Col>
          </Row>
        </FlexboxGrid.Item>

        {/* actions */}
        <FlexboxGrid.Item colspan={12}>
          <FlexboxGrid justify="end" align="middle">
            {/* additional menu content */}
            <FlexboxGrid.Item>{additionalMenu}</FlexboxGrid.Item>

            {/* save btns */}
            <StyledFlexboxItem>{actionsView()}</StyledFlexboxItem>
          </FlexboxGrid>
        </FlexboxGrid.Item>
      </StyledFlexboxGrid>
    </>
  )
}
