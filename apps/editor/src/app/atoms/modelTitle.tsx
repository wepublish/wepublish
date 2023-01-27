import styled from '@emotion/styled'
import {ReactChild} from 'react'
import {MdChevronLeft} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {Button, Col, FlexboxGrid, Loader as RLoader, Row} from 'rsuite'

const ChevronLeft = styled(MdChevronLeft)`
  fontsize: 48px;
`

const FlexGrid = styled(FlexboxGrid)`
  padding-right: 5px;
  padding-bottom: 20px;
`

const FlexboxItem = styled(FlexboxGrid.Item)`
  margin-left: 40px;
`

const Loader = styled(RLoader)`
  margin-right: 5px;
`

const SaveButton = styled(Button)`
  margin-right: 10px;
`

const PaddedCol = styled(Col)`
  padding-top: 3px;
  margin-right: 1rem;
`

const FlexRow = styled(Row)`
  display: flex;
  align-items: center;
`

const FlexLink = styled(Link)`
  display: flex;
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
          <Loader />
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
        <SaveButton appearance="ghost" loading={loading} type="submit" data-testid="saveButton">
          {saveBtnTitle}
        </SaveButton>
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
    <FlexGrid align="middle">
      {/* title */}
      <FlexboxGrid.Item colspan={12}>
        <FlexboxGrid align="middle">
          <FlexRow>
            <PaddedCol xs={3}>
              <h1>
                <FlexLink to={closePath}>
                  <ChevronLeft />
                </FlexLink>
              </h1>
            </PaddedCol>
            <Col xs={26}>
              <h2>{titleView()}</h2>
            </Col>
          </FlexRow>
        </FlexboxGrid>
      </FlexboxGrid.Item>

      {/* actions */}
      <FlexboxGrid.Item colspan={12}>
        <FlexboxGrid justify="end" align="middle">
          {/* additional menu content */}
          <FlexboxGrid.Item>{additionalMenu}</FlexboxGrid.Item>

          {/* save btns */}
          <FlexboxItem>{actionsView()}</FlexboxItem>
        </FlexboxGrid>
      </FlexboxGrid.Item>
    </FlexGrid>
  )
}
